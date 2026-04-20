import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { createServiceSupabase } from "../../config/supabase.js";
import { sendActionError, sendConfirmSuccess, sendSendOffersSuccess } from "../../lib/action-replies.js";
import { enqueueSendOfferNotificationJobs } from "../../lib/queue.js";
import { filterMatchingPreferences, type OpenSlotRow, type StandbyPreferenceRow } from "../../lib/standby-matcher.js";
import { requireCustomer, requireStaff } from "../../plugins/guards.js";
import { executeBulkOpenSlotAction } from "./bulk-actions.js";
import {
  loadStaffActorLabels,
  mergeMetadata,
  touchOpenSlotByStaff,
} from "./staff-attribution.js";

const createSlotBody = z
  .object({
    location_id: z.string().uuid().nullable().optional(),
    provider_id: z.string().uuid().nullable().optional(),
    service_id: z.string().uuid().nullable().optional(),
    provider_name_snapshot: z.string().max(200).nullable().optional(),
    starts_at: z.string().datetime(),
    ends_at: z.string().datetime(),
    estimated_value_cents: z.number().int().min(0).nullable().optional(),
    notes: z.string().max(2000).nullable().optional(),
  })
  .strict();

const sendOffersBody = z
  .object({
    offer_ttl_seconds: z.number().int().min(60).max(7200).default(300),
    channel: z.enum(["push", "sms", "email"]).default("push"),
  })
  .strict();

const confirmBody = z
  .object({
    claim_id: z.string().uuid(),
  })
  .strict();

const claimBody = z
  .object({
    deposit_payment_intent_id: z.string().optional(),
  })
  .strict();

const RESOLUTION_STATUSES = [
  "none",
  "handled_manually",
  "no_retry_needed",
  "customer_contacted",
  "provider_unavailable",
  "ignore",
] as const;

const patchInternalNoteBody = z
  .object({
    resolution_status: z.enum(RESOLUTION_STATUSES),
    internal_note: z.string().max(5000).nullable().optional(),
  })
  .strict();

const bulkActionBody = z
  .object({
    action: z.enum(["retry_offers", "expire"]),
    open_slot_ids: z.array(z.string().uuid()).min(1).max(50),
  })
  .strict();

async function assertSlotInBusiness(
  admin: ReturnType<typeof createServiceSupabase>,
  slotId: string,
  businessId: string,
) {
  const { data } = await admin
    .from("open_slots")
    .select("id")
    .eq("id", slotId)
    .eq("business_id", businessId)
    .maybeSingle();
  return Boolean(data);
}

function pickWinningClaim(claims: unknown): Record<string, unknown> | null {
  if (!Array.isArray(claims)) return null;
  const won = claims.find((c: { status?: string }) => c.status === "won" || c.status === "confirmed");
  return (won as Record<string, unknown>) ?? null;
}

function mapSlotListRow(row: Record<string, unknown>) {
  const { slot_claims: claims, ...rest } = row;
  return {
    ...rest,
    winning_claim: pickWinningClaim(claims),
  };
}

async function listOpenSlots(req: FastifyRequest, reply: FastifyReply) {
  const admin = createServiceSupabase(req.server.env);
  const q = req.query as { status?: string };

  let query = admin
    .from("open_slots")
    .select("*, slot_claims(id, customer_id, claimed_at, status)")
    .eq("business_id", req.staff!.business_id)
    .order("starts_at", { ascending: true });

  if (q.status) {
    query = query.eq("status", q.status);
  }

  const { data, error } = await query;
  if (error) return reply.status(500).send({ error: "list_failed" });
  const rows = (data ?? []).map((r) => mapSlotListRow(r as Record<string, unknown>));
  return reply.send({ openSlots: rows });
}

export async function registerOpenSlotRoutes(app: FastifyInstance) {
  app.get("/v1/open-slots", { preHandler: requireStaff }, listOpenSlots);
  app.get("/v1/open-slots/mine", { preHandler: requireStaff }, listOpenSlots);

  app.post(
    "/v1/open-slots/bulk-action",
    { preHandler: requireStaff },
    async (req, reply) => {
      const parsed = bulkActionBody.safeParse(req.body ?? {});
      if (!parsed.success) {
        return reply.status(400).send({
          error: { code: "invalid_request", message: "Invalid bulk action payload.", retryable: false },
        });
      }
      const admin = createServiceSupabase(req.server.env);
      const out = await executeBulkOpenSlotAction(admin, req.server.env, {
        businessId: req.staff!.business_id,
        staffId: req.staff!.id,
        authUserId: req.authUser!.id,
        action: parsed.data.action,
        openSlotIds: parsed.data.open_slot_ids,
      });
      return reply.send(out);
    },
  );

  app.get(
    "/v1/open-slots/:id/timeline",
    { preHandler: requireStaff },
    async (req, reply) => {
      const admin = createServiceSupabase(req.server.env);
      const slotId = z.string().uuid().parse((req.params as { id?: string }).id);

      const ok = await assertSlotInBusiness(admin, slotId, req.staff!.business_id);
      if (!ok) return reply.status(404).send({ error: "not_found" });

      const { data, error } = await admin
        .from("audit_events")
        .select("id, actor_type, actor_id, event_type, entity_type, entity_id, metadata, created_at")
        .eq("entity_type", "open_slot")
        .eq("entity_id", slotId)
        .order("created_at", { ascending: true });

      if (error) {
        req.log.error({ error }, "slot timeline failed");
        return reply.status(500).send({ error: "timeline_failed" });
      }

      const raw = (data ?? []) as Array<{
        id: string;
        actor_type: string;
        actor_id: string | null;
        event_type: string;
        entity_type: string;
        entity_id: string | null;
        metadata: Record<string, unknown>;
        created_at: string;
      }>;

      const staffIds = raw
        .filter((e) => e.actor_type === "staff" && e.actor_id)
        .map((e) => e.actor_id as string);
      const labels = await loadStaffActorLabels(admin, req.staff!.business_id, staffIds);

      const events = raw.map((e) => {
        let actor_label: string | null = null;
        if (e.actor_type === "staff" && e.actor_id) {
          actor_label = labels.get(e.actor_id) ?? "Staff";
        } else if (e.actor_type === "customer") {
          actor_label = "Customer";
        } else if (e.actor_type === "system") {
          actor_label = "System";
        }

        return { ...e, actor_label };
      });

      return reply.send({ events });
    },
  );

  app.get(
    "/v1/open-slots/:id/notification-logs",
    { preHandler: requireStaff },
    async (req, reply) => {
      const admin = createServiceSupabase(req.server.env);
      const slotId = z.string().uuid().parse((req.params as { id?: string }).id);

      const ok = await assertSlotInBusiness(admin, slotId, req.staff!.business_id);
      if (!ok) return reply.status(404).send({ error: "not_found" });

      const { data, error } = await admin
        .from("notification_logs")
        .select("id, customer_id, open_slot_id, slot_offer_id, channel, status, error, metadata, created_at")
        .eq("open_slot_id", slotId)
        .order("created_at", { ascending: false });

      if (error) {
        req.log.error({ error }, "notification logs failed");
        return reply.status(500).send({ error: "notification_logs_failed" });
      }

      return reply.send({ logs: data ?? [] });
    },
  );

  app.post(
    "/v1/open-slots",
    { preHandler: requireStaff },
    async (req, reply) => {
      const admin = createServiceSupabase(req.server.env);
      const body = createSlotBody.parse(req.body ?? {});

      const { data, error } = await admin
        .from("open_slots")
        .insert({
          ...body,
          business_id: req.staff!.business_id,
          created_by: req.staff!.id,
          status: "open",
        })
        .select("*")
        .single();

      if (error) {
        req.log.error({ error }, "create slot failed");
        return reply.status(500).send({ error: "create_failed" });
      }

      await admin.from("audit_events").insert({
        business_id: req.staff!.business_id,
        actor_type: "staff",
        actor_id: req.staff!.id,
        event_type: "open_slot_created",
        entity_type: "open_slot",
        entity_id: data.id,
        metadata: mergeMetadata({}, req.authUser!.id),
      });

      await touchOpenSlotByStaff(admin, data.id, req.staff!.id);

      return reply.status(201).send(data);
    },
  );

  app.get(
    "/v1/open-slots/:id",
    { preHandler: requireStaff },
    async (req, reply) => {
      const admin = createServiceSupabase(req.server.env);
      const id = z.string().uuid().parse((req.params as { id?: string }).id);

      const ok = await assertSlotInBusiness(admin, id, req.staff!.business_id);
      if (!ok) return reply.status(404).send({ error: "not_found" });

      const { data, error } = await admin
        .from("open_slots")
        .select(
          "*, slot_offers(id, customer_id, channel, status, sent_at, expires_at), slot_claims(id, customer_id, claimed_at, status), last_touched_staff:staff_users!last_touched_by_staff_id(id, full_name, email)",
        )
        .eq("id", id)
        .single();
      if (error) return reply.status(500).send({ error: "load_failed" });
      const row = data as Record<string, unknown>;
      const { slot_claims: claims, last_touched_staff: lastTouchedStaff, ...slotRest } = row;
      return reply.send({
        slot: {
          ...slotRest,
          winning_claim: pickWinningClaim(claims),
          last_touched_by: lastTouchedStaff ?? null,
        },
      });
    },
  );

  app.get(
    "/v1/open-slots/:id/offers",
    { preHandler: requireStaff },
    async (req, reply) => {
      const admin = createServiceSupabase(req.server.env);
      const id = z.string().uuid().parse((req.params as { id?: string }).id);

      const ok = await assertSlotInBusiness(admin, id, req.staff!.business_id);
      if (!ok) return reply.status(404).send({ error: "not_found" });

      const { data, error } = await admin.from("slot_offers").select("*").eq("open_slot_id", id).order("sent_at", {
        ascending: false,
      });
      if (error) return reply.status(500).send({ error: "list_failed" });
      return reply.send(data ?? []);
    },
  );

  app.post(
    "/v1/open-slots/:id/send-offers",
    { preHandler: requireStaff },
    async (req, reply) => {
      const admin = createServiceSupabase(req.server.env);
      const id = z.string().uuid().parse((req.params as { id?: string }).id);
      const opts = sendOffersBody.parse(req.body ?? {});

      const ok = await assertSlotInBusiness(admin, id, req.staff!.business_id);
      if (!ok) {
        return sendActionError(reply, 404, "not_found", "This opening no longer exists.", false);
      }

      const { data: slot, error: slotErr } = await admin.from("open_slots").select("*").eq("id", id).single();
      if (slotErr || !slot) {
        req.log.error({ slotErr }, "slot load failed");
        return sendActionError(reply, 404, "not_found", "This opening no longer exists.", false);
      }

      const status = String(slot.status ?? "");
      const previousStatus = status;

      if (status === "claimed") {
        return sendActionError(
          reply,
          409,
          "slot_already_claimed",
          "This opening already has a claimant and can’t be re-offered.",
          false,
        );
      }
      if (status === "booked") {
        return sendActionError(
          reply,
          409,
          "slot_already_booked",
          "This opening has already been confirmed.",
          false,
        );
      }
      if (status === "expired") {
        return sendActionError(
          reply,
          409,
          "slot_expired",
          "This opening has expired and can no longer send offers.",
          false,
        );
      }
      if (status === "cancelled") {
        return sendActionError(
          reply,
          409,
          "slot_cancelled",
          "This opening was cancelled and can no longer send offers.",
          false,
        );
      }

      if (status !== "open" && status !== "offered") {
        return sendActionError(
          reply,
          409,
          "invalid_request",
          "This opening cannot send offers in its current state.",
          false,
          { current_status: status },
        );
      }

      const { data: business, error: bizErr } = await admin
        .from("businesses")
        .select("*")
        .eq("id", slot.business_id)
        .single();
      if (bizErr || !business) return reply.status(500).send({ error: "business_load_failed" });

      const { data: prefs, error: prefErr } = await admin
        .from("standby_preferences")
        .select("*")
        .eq("business_id", slot.business_id)
        .eq("active", true);
      if (prefErr) return reply.status(500).send({ error: "prefs_load_failed" });

      const slotRow = slot as OpenSlotRow;
      const prefRows = (prefs ?? []) as StandbyPreferenceRow[];
      const matches = filterMatchingPreferences(slotRow, { timezone: business.timezone }, prefRows);

      const uniqueByCustomer = new Map<string, StandbyPreferenceRow>();
      for (const m of matches) {
        uniqueByCustomer.set(m.customer_id, m);
      }
      const uniqueMatches = [...uniqueByCustomer.values()];

      if (uniqueMatches.length === 0) {
        await admin.from("audit_events").insert({
          business_id: req.staff!.business_id,
          actor_type: "staff",
          actor_id: req.staff!.id,
          event_type: "offers_no_match",
          entity_type: "open_slot",
          entity_id: id,
          metadata: mergeMetadata({ matched: 0 }, req.authUser!.id),
        });

        await touchOpenSlotByStaff(admin, id, req.staff!.id);

        return sendSendOffersSuccess(reply, {
          ok: true,
          result: "no_matches",
          open_slot_id: id,
          matched: 0,
          offer_ids: [],
          message: "No matching standby customers were found.",
        });
      }

      const expiresAt = new Date(Date.now() + opts.offer_ttl_seconds * 1000).toISOString();
      const offerRows = uniqueMatches.map((m) => ({
        open_slot_id: id,
        customer_id: m.customer_id,
        channel: opts.channel,
        expires_at: expiresAt,
        status: "sent" as const,
      }));

      const { data: inserted, error: insErr } = await admin
        .from("slot_offers")
        .upsert(offerRows, { onConflict: "open_slot_id,customer_id" })
        .select("id, customer_id, channel");

      if (insErr) {
        req.log.error({ insErr }, "offer upsert failed");
        return reply.status(500).send({ error: "offer_create_failed" });
      }

      const { error: slotUpdErr } = await admin
        .from("open_slots")
        .update({ status: "offered", last_offer_batch_at: new Date().toISOString() })
        .eq("id", id);
      if (slotUpdErr) return reply.status(500).send({ error: "slot_update_failed" });

      const offerRowsForQueue = inserted ?? [];
      const offerIds = offerRowsForQueue.map((o) => o.id);
      const queuePayloads = offerRowsForQueue.map((o) => ({
        offerId: o.id,
        openSlotId: id,
        customerId: o.customer_id,
        channel: o.channel as "push" | "sms" | "email",
      }));
      const queued = await enqueueSendOfferNotificationJobs(req.server.env, queuePayloads);

      for (const row of offerRowsForQueue) {
        await admin.from("notification_logs").insert({
          open_slot_id: id,
          slot_offer_id: row.id,
          customer_id: row.customer_id,
          channel: row.channel,
          status: queued.queued ? "queued" : "skipped_no_queue",
          error: null,
          metadata: {},
        });
      }

      await admin.from("audit_events").insert({
        business_id: req.staff!.business_id,
        actor_type: "staff",
        actor_id: req.staff!.id,
        event_type: "offers_sent",
        entity_type: "open_slot",
        entity_id: id,
        metadata: mergeMetadata({ count: offerIds.length, queued: queued.queued }, req.authUser!.id),
      });

      await touchOpenSlotByStaff(admin, id, req.staff!.id);

      const count = offerIds.length;
      const resultKind = previousStatus === "open" ? "offers_sent" : "offers_retried";
      const message =
        count === 0
          ? "No new offers created (all customers may already have an offer for this slot)."
          : resultKind === "offers_sent"
            ? `Sent ${count} offer${count === 1 ? "" : "s"}.`
            : `Retried ${count} offer${count === 1 ? "" : "s"}.`;

      return sendSendOffersSuccess(reply, {
        ok: true,
        result: resultKind,
        open_slot_id: id,
        matched: count,
        offer_ids: offerIds,
        message,
        notification_queue: { queued: queued.queued, count: queued.count },
      });
    },
  );

  app.post(
    "/v1/open-slots/:id/claim",
    { preHandler: requireCustomer },
    async (req, reply) => {
      const admin = createServiceSupabase(req.server.env);
      const openSlotId = z.string().uuid().parse((req.params as { id?: string }).id);
      const body = claimBody.parse(req.body ?? {});

      const { data, error } = await admin.rpc("claim_open_slot", {
        p_open_slot_id: openSlotId,
        p_customer_id: req.customer!.id,
        p_deposit_payment_intent_id: body.deposit_payment_intent_id ?? null,
      });

      if (error) {
        req.log.error({ error }, "claim_open_slot rpc failed");
        return reply.status(500).send({ error: "claim_failed" });
      }

      const result = data as { ok?: boolean; error?: string; claim_id?: string };
      if (!result?.ok) {
        return reply.status(409).send({ error: result?.error ?? "claim_rejected" });
      }

      return reply.send({
        ok: true,
        claim_id: result.claim_id,
        claim: {
          id: result.claim_id,
          open_slot_id: openSlotId,
          customer_id: req.customer!.id,
          status: "won",
        },
      });
    },
  );

  app.post(
    "/v1/open-slots/:id/confirm",
    { preHandler: requireStaff },
    async (req, reply) => {
      const admin = createServiceSupabase(req.server.env);
      const slotId = z.string().uuid().parse((req.params as { id?: string }).id);
      const parsed = confirmBody.safeParse(req.body ?? {});
      if (!parsed.success) {
        return sendActionError(reply, 400, "invalid_request", "A valid claim ID is required.", false);
      }
      const body = parsed.data;

      const ok = await assertSlotInBusiness(admin, slotId, req.staff!.business_id);
      if (!ok) {
        return sendActionError(reply, 404, "not_found", "This opening or claim no longer exists.", false);
      }

      const { data: slotRow, error: slotLoadErr } = await admin
        .from("open_slots")
        .select("id, status")
        .eq("id", slotId)
        .maybeSingle();

      if (slotLoadErr || !slotRow) {
        return sendActionError(reply, 404, "not_found", "This opening or claim no longer exists.", false);
      }

      const st = String((slotRow as { status: string }).status);

      if (st === "booked") {
        const { data: claimRow } = await admin
          .from("slot_claims")
          .select("id, status, open_slot_id")
          .eq("id", body.claim_id)
          .maybeSingle();

        if (!claimRow || (claimRow as { open_slot_id: string }).open_slot_id !== slotId) {
          return sendActionError(
            reply,
            404,
            "not_found",
            "This opening or claim no longer exists.",
            false,
          );
        }

        const cst = String((claimRow as { status: string }).status);
        if (cst === "confirmed") {
          return sendConfirmSuccess(reply, {
            ok: true,
            result: "already_confirmed",
            open_slot_id: slotId,
            claim_id: body.claim_id,
            status: "booked",
            message: "This booking was already confirmed.",
          });
        }

        return sendActionError(
          reply,
          409,
          "slot_terminal_state",
          "This opening can no longer be confirmed.",
          false,
          { current_status: st },
        );
      }

      if (st === "expired" || st === "cancelled") {
        return sendActionError(
          reply,
          409,
          "slot_terminal_state",
          "This opening can no longer be confirmed.",
          false,
          { current_status: st },
        );
      }

      if (st !== "claimed") {
        return sendActionError(
          reply,
          409,
          "slot_not_claimed",
          "This opening is no longer awaiting confirmation.",
          false,
          { current_status: st },
        );
      }

      const { data, error } = await admin.rpc("confirm_open_slot_claim", {
        p_open_slot_id: slotId,
        p_claim_id: body.claim_id,
        p_staff_auth_user_id: req.authUser!.id,
      });

      if (error) {
        req.log.error({ error }, "confirm rpc failed");
        return sendActionError(
          reply,
          500,
          "server_error",
          "Could not confirm this booking. Try again.",
          true,
        );
      }

      const result = data as { ok?: boolean; error?: string; status?: string };
      if (!result?.ok) {
        const err = result?.error ?? "";
        if (err === "forbidden") {
          return sendActionError(
            reply,
            403,
            "forbidden",
            "You do not have access to confirm this opening.",
            false,
          );
        }
        if (err === "slot_not_found") {
          return sendActionError(reply, 404, "not_found", "This opening or claim no longer exists.", false);
        }
        if (err === "slot_not_claimed") {
          const cs = result.status ? String(result.status) : undefined;
          if (cs === "expired" || cs === "cancelled") {
            return sendActionError(
              reply,
              409,
              "slot_terminal_state",
              "This opening can no longer be confirmed.",
              false,
              { current_status: cs },
            );
          }
          return sendActionError(
            reply,
            409,
            "slot_not_claimed",
            "This opening is no longer awaiting confirmation.",
            false,
            cs ? { current_status: cs } : undefined,
          );
        }
        if (err === "claim_not_found" || err === "claim_not_won") {
          return sendActionError(
            reply,
            409,
            "claim_mismatch",
            "That claim no longer matches this opening.",
            false,
          );
        }
        return sendActionError(
          reply,
          409,
          "slot_terminal_state",
          "This opening can no longer be confirmed.",
          false,
        );
      }

      await admin.from("audit_events").insert({
        business_id: req.staff!.business_id,
        actor_type: "staff",
        actor_id: req.staff!.id,
        event_type: "slot_confirmed",
        entity_type: "open_slot",
        entity_id: slotId,
        metadata: mergeMetadata({ claim_id: body.claim_id }, req.authUser!.id),
      });

      await touchOpenSlotByStaff(admin, slotId, req.staff!.id);

      return sendConfirmSuccess(reply, {
        ok: true,
        result: "confirmed",
        open_slot_id: slotId,
        claim_id: body.claim_id,
        status: "booked",
        message: "Booking confirmed.",
      });
    },
  );

  app.post(
    "/v1/open-slots/:id/cancel",
    { preHandler: requireStaff },
    async (req, reply) => {
      const admin = createServiceSupabase(req.server.env);
      const id = z.string().uuid().parse((req.params as { id?: string }).id);

      const ok = await assertSlotInBusiness(admin, id, req.staff!.business_id);
      if (!ok) return reply.status(404).send({ error: "not_found" });

      const { data, error } = await admin.rpc("staff_cancel_open_slot", {
        p_open_slot_id: id,
        p_staff_auth_user_id: req.authUser!.id,
      });

      if (error) return reply.status(500).send({ error: "cancel_failed" });
      const result = data as { ok?: boolean; error?: string };
      if (!result?.ok) return reply.status(409).send({ error: result?.error ?? "cancel_rejected" });

      await admin.from("audit_events").insert({
        business_id: req.staff!.business_id,
        actor_type: "staff",
        actor_id: req.staff!.id,
        event_type: "slot_cancelled",
        entity_type: "open_slot",
        entity_id: id,
        metadata: mergeMetadata({ source: "staff_action" }, req.authUser!.id),
      });
      await touchOpenSlotByStaff(admin, id, req.staff!.id);

      return reply.send({ ok: true });
    },
  );

  app.patch(
    "/v1/open-slots/:id/internal-note",
    { preHandler: requireStaff },
    async (req, reply) => {
      const admin = createServiceSupabase(req.server.env);
      const id = z.string().uuid().parse((req.params as { id?: string }).id);
      const body = patchInternalNoteBody.safeParse(req.body ?? {});
      if (!body.success) {
        return reply.status(400).send({
          error: { code: "invalid_request", message: "Invalid internal note payload.", retryable: false },
        });
      }

      const ok = await assertSlotInBusiness(admin, id, req.staff!.business_id);
      if (!ok) {
        return reply.status(404).send({
          error: { code: "not_found", message: "This opening no longer exists.", retryable: false },
        });
      }

      const patch: Record<string, unknown> = {
        resolution_status: body.data.resolution_status,
        internal_note_updated_at: new Date().toISOString(),
      };
      if (body.data.internal_note !== undefined) {
        const v = body.data.internal_note;
        patch.internal_note = v == null || v.trim() === "" ? null : v.trim();
      }

      const { data: updated, error: updErr } = await admin
        .from("open_slots")
        .update(patch)
        .eq("id", id)
        .select("internal_note, resolution_status, internal_note_updated_at")
        .single();

      if (updErr || !updated) {
        req.log.error({ updErr }, "internal note update failed");
        return reply.status(500).send({
          error: { code: "server_error", message: "Could not save internal note.", retryable: true },
        });
      }

      const row = updated as {
        internal_note: string | null;
        resolution_status: string;
        internal_note_updated_at: string | null;
      };

      await touchOpenSlotByStaff(admin, id, req.staff!.id);

      await admin.from("audit_events").insert({
        business_id: req.staff!.business_id,
        actor_type: "staff",
        actor_id: req.staff!.id,
        event_type: "operator_internal_note_updated",
        entity_type: "open_slot",
        entity_id: id,
        metadata: mergeMetadata({ resolution_status: row.resolution_status }, req.authUser!.id),
      });

      return reply.send({
        ok: true,
        open_slot_id: id,
        internal_note: row.internal_note,
        resolution_status: row.resolution_status,
        internal_note_updated_at: row.internal_note_updated_at,
        message: "Internal note saved.",
      });
    },
  );

  app.post(
    "/v1/open-slots/:id/expire",
    { preHandler: requireStaff },
    async (req, reply) => {
      const admin = createServiceSupabase(req.server.env);
      const id = z.string().uuid().parse((req.params as { id?: string }).id);

      const ok = await assertSlotInBusiness(admin, id, req.staff!.business_id);
      if (!ok) return reply.status(404).send({ error: "not_found" });

      const { data, error } = await admin.rpc("staff_expire_open_slot", {
        p_open_slot_id: id,
        p_staff_auth_user_id: req.authUser!.id,
      });

      if (error) return reply.status(500).send({ error: "expire_failed" });
      const result = data as { ok?: boolean; error?: string };
      if (!result?.ok) return reply.status(409).send({ error: result?.error ?? "expire_rejected" });

      await admin.from("audit_events").insert({
        business_id: req.staff!.business_id,
        actor_type: "staff",
        actor_id: req.staff!.id,
        event_type: "slot_expired",
        entity_type: "open_slot",
        entity_id: id,
        metadata: mergeMetadata({ source: "staff_action" }, req.authUser!.id),
      });
      await touchOpenSlotByStaff(admin, id, req.staff!.id);

      return reply.send({ ok: true });
    },
  );
}
