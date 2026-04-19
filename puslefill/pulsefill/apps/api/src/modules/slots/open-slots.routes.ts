import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { createServiceSupabase } from "../../config/supabase.js";
import { enqueueSendOfferNotificationJobs } from "../../lib/queue.js";
import { filterMatchingPreferences, type OpenSlotRow, type StandbyPreferenceRow } from "../../lib/standby-matcher.js";
import { requireCustomer, requireStaff } from "../../plugins/guards.js";

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

      return reply.send({ events: data ?? [] });
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
        .select("id, customer_id, open_slot_id, slot_offer_id, channel, status, metadata, created_at")
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
        metadata: {},
      });

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
          "*, slot_offers(id, customer_id, channel, status, sent_at, expires_at), slot_claims(id, customer_id, claimed_at, status)",
        )
        .eq("id", id)
        .single();
      if (error) return reply.status(500).send({ error: "load_failed" });
      const row = data as Record<string, unknown>;
      const { slot_claims: claims, ...slotRest } = row;
      return reply.send({
        slot: {
          ...slotRest,
          winning_claim: pickWinningClaim(claims),
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
      if (!ok) return reply.status(404).send({ error: "not_found" });

      const { data: slot, error: slotErr } = await admin.from("open_slots").select("*").eq("id", id).single();
      if (slotErr || !slot) return reply.status(500).send({ error: "slot_load_failed" });

      if (!["open", "offered"].includes(slot.status as string)) {
        return reply.status(409).send({ error: "slot_not_sendable", status: slot.status });
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
          metadata: { matched: 0 },
        });

        return reply.send({
          ok: true,
          matched: 0,
          offers: [],
          message: "No matching standby customers yet. Add or widen standby preferences for customers.",
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
        metadata: { count: offerIds.length, queued: queued.queued },
      });

      const count = offerIds.length;
      return reply.send({
        ok: true,
        matched: uniqueMatches.length,
        offer_ids: offerIds,
        notification_queue: queued,
        message:
          count === 0
            ? "No new offers created (all customers may already have an offer for this slot)."
            : `Sent ${count} offer${count === 1 ? "" : "s"}.`,
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
      const body = confirmBody.parse(req.body ?? {});

      const ok = await assertSlotInBusiness(admin, slotId, req.staff!.business_id);
      if (!ok) return reply.status(404).send({ error: "not_found" });

      const { data, error } = await admin.rpc("confirm_open_slot_claim", {
        p_open_slot_id: slotId,
        p_claim_id: body.claim_id,
        p_staff_auth_user_id: req.authUser!.id,
      });

      if (error) {
        req.log.error({ error }, "confirm rpc failed");
        return reply.status(500).send({ error: "confirm_failed" });
      }

      const result = data as { ok?: boolean; error?: string };
      if (!result?.ok) {
        return reply.status(409).send({ error: result?.error ?? "confirm_rejected" });
      }

      return reply.send({ ok: true });
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
      return reply.send({ ok: true });
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
      return reply.send({ ok: true });
    },
  );
}
