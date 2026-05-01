import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { createServiceSupabase } from "../../config/supabase.js";
import { sendActionError, sendConfirmSuccess } from "../../lib/action-replies.js";
import { sendJson } from "../../lib/http-errors.js";
import { requireCustomer, requireStaff } from "../../plugins/guards.js";
import { rateLimitTier } from "../../plugins/rate-limit.js";
import { executeBulkOpenSlotAction } from "./bulk-actions.js";
import {
  buildOperatorActionRejectionDetails,
  checkOperatorActionAllowed,
} from "./assert-operator-action-allowed.js";
import { canPerformAction } from "./operator-slot-rules.js";
import {
  baseSignalsFromOpenSlotRow,
  buildOperatorAvailableActions,
  buildOperatorSlotQueueContext,
  enrichOperatorSlotDetailSignals,
  type OperatorSlotAvailableAction,
  type OperatorSlotQueueContext,
} from "./operator-slot-detail-context.js";
import { loadSlotRuleContext } from "./load-slot-rule-context.js";
import {
  getCancelOpenSlotMutationTestDelegate,
  getClaimOpenSlotRpcTestDelegate,
  getConfirmBookedClaimLookupTestDelegate,
  getConfirmOpenSlotMutationTestDelegate,
  getExpireOpenSlotMutationTestDelegate,
} from "./open-slots-route-test-seams.js";
import { notifyCustomerBookingConfirmed } from "./notification-hooks.js";
import { sendOpenSlotOffersRouteHandler } from "./send-offers-route.js";
import {
  loadStaffActorLabels,
  mergeMetadata,
  touchOpenSlotByStaff,
} from "./staff-attribution.js";

export { setNotificationEventHookTestDelegate } from "./notification-hooks.js";

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

type OpenSlotDetailResponse = {
  slot: Record<string, unknown>;
  queue_context: OperatorSlotQueueContext;
  available_actions: OperatorSlotAvailableAction[];
};

type OpenSlotDetailRouteLoadResult =
  | { kind: "ok"; payload: OpenSlotDetailResponse }
  | { kind: "not_found" };

let openSlotDetailTestDelegate:
  | null
  | ((
      admin: ReturnType<typeof createServiceSupabase>,
      input: { slotId: string; businessId: string },
    ) => Promise<OpenSlotDetailRouteLoadResult>) = null;

export function setOpenSlotDetailTestDelegate(
  delegate:
    | ((
        admin: ReturnType<typeof createServiceSupabase>,
        input: { slotId: string; businessId: string },
      ) => Promise<OpenSlotDetailRouteLoadResult>)
    | null,
) {
  openSlotDetailTestDelegate = delegate;
}

async function loadOpenSlotDetailRoutePayload(
  admin: ReturnType<typeof createServiceSupabase>,
  input: { slotId: string; businessId: string },
): Promise<OpenSlotDetailRouteLoadResult> {
  const { slotId, businessId } = input;
  const ok = await assertSlotInBusiness(admin, slotId, businessId);
  if (!ok) return { kind: "not_found" };

  const { data, error } = await admin
    .from("open_slots")
    .select(
      "*, slot_offers(id, customer_id, channel, status, sent_at, expires_at), slot_claims(id, customer_id, claimed_at, status), last_touched_staff:staff_users!last_touched_by_staff_id(id, full_name, email)",
    )
    .eq("id", slotId)
    .single();
  if (error) {
    throw new Error("load_failed");
  }

  const row = data as Record<string, unknown>;
  const signalsBase = baseSignalsFromOpenSlotRow(row);
  const signals = await enrichOperatorSlotDetailSignals(admin, businessId, slotId, signalsBase);
  const queue_context = buildOperatorSlotQueueContext(signals);
  const available_actions = buildOperatorAvailableActions(signals, queue_context);
  const { slot_claims: claims, last_touched_staff: lastTouchedStaff, ...slotRest } = row;

  return {
    kind: "ok",
    payload: {
      slot: {
        ...slotRest,
        winning_claim: pickWinningClaim(claims),
        last_touched_by: lastTouchedStaff ?? null,
      },
      queue_context,
      available_actions,
    },
  };
}

function pickWinningClaim(claims: unknown): Record<string, unknown> | null {
  if (!Array.isArray(claims)) return null;
  const won = claims.find((c: { status?: string }) => c.status === "won" || c.status === "confirmed");
  return (won as Record<string, unknown>) ?? null;
}

function locationNameFromEmbed(loc: unknown): string | null {
  if (loc == null) return null;
  if (Array.isArray(loc)) {
    const first = loc[0];
    if (first && typeof first === "object" && first !== null && "name" in first) {
      return String((first as { name: unknown }).name);
    }
    return null;
  }
  if (typeof loc === "object" && "name" in loc) {
    return String((loc as { name: unknown }).name);
  }
  return null;
}

function mapSlotListRow(row: Record<string, unknown>) {
  const { slot_claims: claims, locations: loc, ...rest } = row;
  const location_name = locationNameFromEmbed(loc);
  return {
    ...rest,
    winning_claim: pickWinningClaim(claims),
    location_name,
  };
}

async function listOpenSlots(req: FastifyRequest, reply: FastifyReply) {
  const admin = createServiceSupabase(req.server.env);
  const q = req.query as { status?: string };

  let query = admin
    .from("open_slots")
    .select("*, slot_claims(id, customer_id, claimed_at, status), locations(name)")
    .eq("business_id", req.staff!.business_id)
    .order("starts_at", { ascending: true });

  if (q.status) {
    query = query.eq("status", q.status);
  }

  const { data, error } = await query;
  if (error) return sendJson(req, reply, 500, { error: "list_failed" });
  const rows = (data ?? []).map((r) => mapSlotListRow(r as Record<string, unknown>));
  return reply.send({ openSlots: rows });
}

export async function registerOpenSlotRoutes(app: FastifyInstance) {
  app.get("/v1/open-slots", { preHandler: requireStaff }, listOpenSlots);
  app.get("/v1/open-slots/mine", { preHandler: requireStaff }, listOpenSlots);

  app.post(
    "/v1/open-slots/bulk-action",
    { preHandler: requireStaff, config: { rateLimit: rateLimitTier.staffAction } },
    async (req, reply) => {
      const parsed = bulkActionBody.safeParse(req.body ?? {});
      if (!parsed.success) {
        return sendJson(req, reply, 400, {
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
      if (!ok) return sendJson(req, reply, 404, { error: "not_found" });

      const { data, error } = await admin
        .from("audit_events")
        .select("id, actor_type, actor_id, event_type, entity_type, entity_id, metadata, created_at")
        .eq("entity_type", "open_slot")
        .eq("entity_id", slotId)
        .order("created_at", { ascending: true });

      if (error) {
        req.log.error({ error }, "slot timeline failed");
        return sendJson(req, reply, 500, { error: "timeline_failed" });
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
      if (!ok) return sendJson(req, reply, 404, { error: "not_found" });

      const { data, error } = await admin
        .from("notification_logs")
        .select("id, customer_id, open_slot_id, slot_offer_id, channel, status, error, metadata, created_at")
        .eq("open_slot_id", slotId)
        .order("created_at", { ascending: false });

      if (error) {
        req.log.error({ error }, "notification logs failed");
        return sendJson(req, reply, 500, { error: "notification_logs_failed" });
      }

      return reply.send({ logs: data ?? [] });
    },
  );

  app.post(
    "/v1/open-slots",
    { preHandler: requireStaff, config: { rateLimit: rateLimitTier.staffAction } },
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
        return sendJson(req, reply, 500, { error: "create_failed" });
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

      try {
        const result = openSlotDetailTestDelegate
          ? await openSlotDetailTestDelegate(admin, { slotId: id, businessId: req.staff!.business_id })
          : await loadOpenSlotDetailRoutePayload(admin, { slotId: id, businessId: req.staff!.business_id });

        if (result.kind === "not_found") return sendJson(req, reply, 404, { error: "not_found" });
        return reply.send(result.payload);
      } catch {
        return sendJson(req, reply, 500, { error: "load_failed" });
      }
    },
  );

  app.get(
    "/v1/open-slots/:id/offers",
    { preHandler: requireStaff },
    async (req, reply) => {
      const admin = createServiceSupabase(req.server.env);
      const id = z.string().uuid().parse((req.params as { id?: string }).id);

      const ok = await assertSlotInBusiness(admin, id, req.staff!.business_id);
      if (!ok) return sendJson(req, reply, 404, { error: "not_found" });

      const { data, error } = await admin.from("slot_offers").select("*").eq("open_slot_id", id).order("sent_at", {
        ascending: false,
      });
      if (error) return sendJson(req, reply, 500, { error: "list_failed" });
      return reply.send(data ?? []);
    },
  );

  app.post(
    "/v1/open-slots/:id/send-offers",
    { preHandler: requireStaff, config: { rateLimit: rateLimitTier.staffAction } },
    sendOpenSlotOffersRouteHandler,
  );

  app.post(
    "/v1/open-slots/:id/claim",
    { preHandler: requireCustomer, config: { rateLimit: rateLimitTier.strict } },
    async (req, reply) => {
      const admin = createServiceSupabase(req.server.env);
      const openSlotId = z.string().uuid().parse((req.params as { id?: string }).id);
      const body = claimBody.parse(req.body ?? {});

      const claimRpcDelegate = getClaimOpenSlotRpcTestDelegate();
      let data: unknown;
      let error: { message: string } | null = null;
      if (claimRpcDelegate) {
        data = await claimRpcDelegate({
          openSlotId,
          customerId: req.customer!.id,
          deposit_payment_intent_id: body.deposit_payment_intent_id ?? null,
        });
      } else {
        const rpcOut = await admin.rpc("claim_open_slot", {
          p_open_slot_id: openSlotId,
          p_customer_id: req.customer!.id,
          p_deposit_payment_intent_id: body.deposit_payment_intent_id ?? null,
        });
        data = rpcOut.data;
        error = rpcOut.error;
      }

      if (error) {
        req.log.error({ error }, "claim_open_slot rpc failed");
        return sendJson(req, reply, 500, { error: "claim_failed" });
      }

      const result = data as { ok?: boolean; error?: string; claim_id?: string };
      if (!result?.ok) {
        return sendJson(req, reply, 409, { error: result?.error ?? "claim_rejected" });
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
    { preHandler: requireStaff, config: { rateLimit: rateLimitTier.staffAction } },
    async (req, reply) => {
      const admin = createServiceSupabase(req.server.env);
      const slotId = z.string().uuid().parse((req.params as { id?: string }).id);
      const parsed = confirmBody.safeParse(req.body ?? {});
      if (!parsed.success) {
        return sendActionError(req, reply, 400, "invalid_request", "A valid claim ID is required.", false);
      }
      const body = parsed.data;

      const loaded = await loadSlotRuleContext(admin, {
        openSlotId: slotId,
        businessId: req.staff!.business_id,
      });
      if (!loaded) {
        return sendActionError(req, reply, 404, "not_found", "This opening or claim no longer exists.", false);
      }

      const st = String(loaded.slot.status ?? "");

      if (st === "booked") {
        const bookedClaimLookup = getConfirmBookedClaimLookupTestDelegate();
        const claimRow = bookedClaimLookup
          ? await bookedClaimLookup({ claimId: body.claim_id, openSlotId: slotId })
          : (
              await admin
                .from("slot_claims")
                .select("id, status, open_slot_id")
                .eq("id", body.claim_id)
                .maybeSingle()
            ).data;

        if (!claimRow || (claimRow as { open_slot_id: string }).open_slot_id !== slotId) {
          return sendActionError(
            req,
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
          req,
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
          req,
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
          req,
          reply,
          409,
          "slot_not_claimed",
          "This opening is no longer awaiting confirmation.",
          false,
          { current_status: st },
        );
      }

      const guardReload = await loadSlotRuleContext(admin, {
        openSlotId: slotId,
        businessId: req.staff!.business_id,
      });
      if (!guardReload) {
        return sendActionError(req, reply, 404, "not_found", "This opening or claim no longer exists.", false);
      }
      if (!canPerformAction("confirm_booking", guardReload.signals)) {
        return sendActionError(
          req,
          reply,
          409,
          "operator_action_not_allowed",
          "Confirm booking is not allowed for this slot in its current state.",
          false,
          buildOperatorActionRejectionDetails("confirm_booking", guardReload.signals) as Record<string, unknown>,
        );
      }

      const confirmTestMutation = getConfirmOpenSlotMutationTestDelegate();
      if (confirmTestMutation) {
        await confirmTestMutation({
          openSlotId: slotId,
          claimId: body.claim_id,
          businessId: req.staff!.business_id,
          staffId: req.staff!.id,
          authUserId: req.authUser!.id,
        });
        try {
          await notifyCustomerBookingConfirmed({
            env: req.server.env,
            supabase: admin,
            businessId: req.staff!.business_id,
            claimId: body.claim_id,
          });
        } catch (e) {
          req.log.warn({ e, claimId: body.claim_id }, "customer_booking_confirmed_notification_failed");
        }
        return sendConfirmSuccess(reply, {
          ok: true,
          result: "confirmed",
          open_slot_id: slotId,
          claim_id: body.claim_id,
          status: "booked",
          message: "Booking confirmed.",
        });
      }

      const { data, error } = await admin.rpc("confirm_open_slot_claim", {
        p_open_slot_id: slotId,
        p_claim_id: body.claim_id,
        p_staff_auth_user_id: req.authUser!.id,
      });

      if (error) {
        req.log.error({ error }, "confirm rpc failed");
        return sendActionError(
          req,
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
            req,
            reply,
            403,
            "forbidden",
            "You do not have access to confirm this opening.",
            false,
          );
        }
        if (err === "slot_not_found") {
          return sendActionError(req, reply, 404, "not_found", "This opening or claim no longer exists.", false);
        }
        if (err === "slot_not_claimed") {
          const cs = result.status ? String(result.status) : undefined;
          if (cs === "expired" || cs === "cancelled") {
            return sendActionError(
              req,
              reply,
              409,
              "slot_terminal_state",
              "This opening can no longer be confirmed.",
              false,
              { current_status: cs },
            );
          }
          return sendActionError(
            req,
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
            req,
            reply,
            409,
            "claim_mismatch",
            "That claim no longer matches this opening.",
            false,
          );
        }
        return sendActionError(
          req,
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

      try {
        await notifyCustomerBookingConfirmed({
          env: req.server.env,
          supabase: admin,
          businessId: req.staff!.business_id,
          claimId: body.claim_id,
        });
      } catch (e) {
        req.log.warn({ e, claimId: body.claim_id }, "customer_booking_confirmed_notification_failed");
      }

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
    { preHandler: requireStaff, config: { rateLimit: rateLimitTier.staffAction } },
    async (req, reply) => {
      const admin = createServiceSupabase(req.server.env);
      const id = z.string().uuid().parse((req.params as { id?: string }).id);

      const cancelGuard = await checkOperatorActionAllowed(admin, {
        openSlotId: id,
        businessId: req.staff!.business_id,
        action: "cancel_slot",
      });
      if (!cancelGuard.ok) {
        if (cancelGuard.status === 404) {
          return sendJson(req, reply, 404, { error: "not_found" });
        }
        return sendActionError(
          req,
          reply,
          409,
          "operator_action_not_allowed",
          "Cancel slot is not allowed for this opening in its current state.",
          false,
          cancelGuard.details as Record<string, unknown>,
        );
      }

      const cancelTestMutation = getCancelOpenSlotMutationTestDelegate();
      let result: { ok?: boolean; error?: string } | null = null;
      try {
        const { data, error } = cancelTestMutation
          ? ({ data: null, error: null } as const)
          : await admin.rpc("staff_cancel_open_slot", {
              p_open_slot_id: id,
              p_staff_auth_user_id: req.authUser!.id,
            });

        const mutationOut = cancelTestMutation
          ? await cancelTestMutation({
              openSlotId: id,
              businessId: req.staff!.business_id,
              staffId: req.staff!.id,
              authUserId: req.authUser!.id,
            })
          : null;

        if (!cancelTestMutation && error) {
          throw new Error("cancel_rpc_failed");
        }
        result = (mutationOut ?? (data as { ok?: boolean; error?: string })) as { ok?: boolean; error?: string };
      } catch (error) {
        req.log.error({ error }, "cancel slot mutation failed");
        return sendActionError(req, reply, 500, "cancel_slot_failed", "Could not cancel slot.", true);
      }

      if (!result?.ok) return sendJson(req, reply, 409, { error: result?.error ?? "cancel_rejected" });

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

      return reply.send({
        ok: true,
        result: "cancelled",
        status: "cancelled",
        message: "Slot cancelled.",
      });
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
        return sendJson(req, reply, 400, {
          error: { code: "invalid_request", message: "Invalid internal note payload.", retryable: false },
        });
      }

      const ok = await assertSlotInBusiness(admin, id, req.staff!.business_id);
      if (!ok) {
        return sendJson(req, reply, 404, {
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
        return sendJson(req, reply, 500, {
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
    { preHandler: requireStaff, config: { rateLimit: rateLimitTier.staffAction } },
    async (req, reply) => {
      const admin = createServiceSupabase(req.server.env);
      const id = z.string().uuid().parse((req.params as { id?: string }).id);

      const expireGuard = await checkOperatorActionAllowed(admin, {
        openSlotId: id,
        businessId: req.staff!.business_id,
        action: "expire_slot",
      });
      if (!expireGuard.ok) {
        if (expireGuard.status === 404) {
          return sendJson(req, reply, 404, { error: "not_found" });
        }
        return sendActionError(
          req,
          reply,
          409,
          "operator_action_not_allowed",
          "Expire slot is not allowed for this opening in its current state.",
          false,
          expireGuard.details as Record<string, unknown>,
        );
      }

      const expireTestMutation = getExpireOpenSlotMutationTestDelegate();
      let result: { ok?: boolean; error?: string } | null = null;
      try {
        const { data, error } = expireTestMutation
          ? ({ data: null, error: null } as const)
          : await admin.rpc("staff_expire_open_slot", {
              p_open_slot_id: id,
              p_staff_auth_user_id: req.authUser!.id,
            });

        const mutationOut = expireTestMutation
          ? await expireTestMutation({
              openSlotId: id,
              businessId: req.staff!.business_id,
              staffId: req.staff!.id,
              authUserId: req.authUser!.id,
            })
          : null;

        if (!expireTestMutation && error) {
          throw new Error("expire_rpc_failed");
        }
        result = (mutationOut ?? (data as { ok?: boolean; error?: string })) as { ok?: boolean; error?: string };
      } catch (error) {
        req.log.error({ error }, "expire slot mutation failed");
        return sendActionError(req, reply, 500, "expire_slot_failed", "Could not expire slot.", true);
      }

      if (!result?.ok) return sendJson(req, reply, 409, { error: result?.error ?? "expire_rejected" });

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

      return reply.send({
        ok: true,
        result: "expired",
        status: "expired",
        message: "Slot expired.",
      });
    },
  );
}
