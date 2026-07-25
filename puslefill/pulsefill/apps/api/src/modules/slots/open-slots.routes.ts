import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import type { Env } from "../../config/env.js";
import { createServiceSupabase } from "../../config/supabase.js";
import { assertStaffBillingCapability } from "../billing/billing-guard.js";
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
import {
  getNotificationDeliveryRouteTestDelegate,
  loadOpenSlotNotificationDelivery,
} from "./open-slot-notification-delivery.js";
import { buildOpenSlotCreateDefaults } from "./open-slot-create-defaults.js";
import { buildNoMatchExplanation, isNoMatchExplanationTestDelegateActive } from "./no-match-explanation.js";
import { sendOpenSlotOffersRouteHandler } from "./send-offers-route.js";
import {
  loadStaffActorLabels,
  mergeMetadata,
  touchOpenSlotByStaff,
} from "./staff-attribution.js";
import { stripeClientFromEnv } from "../billing/billing-stripe.js";
import { getConnectAccountSnapshot } from "../payments/payments-connect.js";
import {
  captureStripePaymentIntent,
  createSlotClaimPaymentIntent,
  markSlotClaimPaymentAuthorized,
  refundStripePayment,
  releaseAuthorizedPaymentByIntentId,
} from "../payments/payments-intents.js";

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
    payment_required: z.boolean().optional(),
    price_cents: z.number().int().min(1).nullable().optional(),
    currency: z.string().length(3).optional(),
  })
  .strict()
  .refine((v) => !v.payment_required || (v.price_cents != null && v.price_cents > 0), {
    message: "price_cents is required when payment_required is true",
    path: ["price_cents"],
  });

const confirmBody = z
  .object({
    claim_id: z.string().uuid(),
  })
  .strict();

const claimBody = z
  .object({
    deposit_payment_intent_id: z.string().optional(),
    payment_intent_id: z.string().optional(),
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
      "*, slot_offers(id, customer_id, channel, status, sent_at, expires_at), slot_claims(id, customer_id, claimed_at, status), slot_claim_payments(id, claim_id, status, amount_cents, application_fee_cents, currency), last_touched_staff:staff_users!last_touched_by_staff_id(id, full_name, email)",
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
  const {
    slot_claims: claims,
    slot_claim_payments: payments,
    last_touched_staff: lastTouchedStaff,
    ...slotRest
  } = row;
  const winningClaim = pickWinningClaim(claims);

  return {
    kind: "ok",
    payload: {
      slot: {
        ...slotRest,
        winning_claim: winningClaim,
        payment: pickRelevantPayment(payments, winningClaim),
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

/** Prefers the payment tied to the winning claim; falls back to the most recent one otherwise. */
function pickRelevantPayment(payments: unknown, winningClaim: Record<string, unknown> | null): Record<string, unknown> | null {
  if (!Array.isArray(payments) || payments.length === 0) return null;
  const winningClaimId = winningClaim?.id;
  if (winningClaimId) {
    const forWinner = payments.find((p: { claim_id?: string | null }) => p.claim_id === winningClaimId);
    if (forWinner) return forWinner as Record<string, unknown>;
  }
  return (payments[payments.length - 1] as Record<string, unknown>) ?? null;
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

const DEFAULT_PAGE_LIMIT = 50;
const MAX_PAGE_LIMIT = 200;

function clampLimit(raw: unknown): number {
  const n = typeof raw === "string" ? parseInt(raw, 10) : NaN;
  if (!Number.isFinite(n) || n <= 0) return DEFAULT_PAGE_LIMIT;
  return Math.min(n, MAX_PAGE_LIMIT);
}

function clampOffset(raw: unknown): number {
  const n = typeof raw === "string" ? parseInt(raw, 10) : NaN;
  if (!Number.isFinite(n) || n < 0) return 0;
  return n;
}

async function listOpenSlots(req: FastifyRequest, reply: FastifyReply) {
  const admin = createServiceSupabase(req.server.env);
  const q = req.query as { status?: string; limit?: string; offset?: string };

  const limit = clampLimit(q.limit);
  const offset = clampOffset(q.offset);

  let query = admin
    .from("open_slots")
    .select("*, slot_claims(id, customer_id, claimed_at, status), locations(name)")
    .eq("business_id", req.staff!.business_id)
    .order("starts_at", { ascending: true })
    // Fetch one extra row past the page to detect hasMore without a separate count query.
    .range(offset, offset + limit);

  if (q.status) {
    query = query.eq("status", q.status);
  }

  const { data, error } = await query;
  if (error) return sendJson(req, reply, 500, { error: "list_failed" });
  const rowsRaw = data ?? [];
  const hasMore = rowsRaw.length > limit;
  const rows = rowsRaw.slice(0, limit).map((r) => mapSlotListRow(r as Record<string, unknown>));
  return reply.send({ openSlots: rows, pagination: { limit, offset, hasMore } });
}

export async function registerOpenSlotRoutes(app: FastifyInstance) {
  app.get("/v1/open-slots", { preHandler: requireStaff }, listOpenSlots);
  app.get("/v1/open-slots/mine", { preHandler: requireStaff }, listOpenSlots);

  app.get(
    "/v1/open-slots/create-defaults",
    { preHandler: requireStaff, config: { rateLimit: rateLimitTier.directoryRead } },
    async (req, reply) => {
      const admin = createServiceSupabase(req.server.env);
      try {
        const out = await buildOpenSlotCreateDefaults(admin, req.staff!.business_id);
        return reply.send(out);
      } catch (err) {
        req.log.error({ err }, "open_slot_create_defaults_failed");
        return sendJson(req, reply, 500, { error: "create_defaults_failed" });
      }
    },
  );

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
      const env = req.server.env as Env;
      if (parsed.data.action === "retry_offers") {
        if (
          !(await assertStaffBillingCapability(req, reply, admin, env, req.staff!.business_id, "send_offers"))
        ) {
          return;
        }
      }

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

  app.get(
    "/v1/open-slots/:id/notification-delivery",
    { preHandler: requireStaff, config: { rateLimit: rateLimitTier.directoryRead } },
    async (req, reply) => {
      const slotId = z.string().uuid().parse((req.params as { id?: string }).id);
      const businessId = req.staff!.business_id;

      const routeTestDelegate =
        process.env.PULSEFILL_API_TEST === "1" ? getNotificationDeliveryRouteTestDelegate() : null;
      if (routeTestDelegate) {
        try {
          const out = await routeTestDelegate({ slotId, businessId });
          if (out.mode === "not_found") return sendJson(req, reply, 404, { error: "not_found" });
          if (out.mode === "server_error") {
            return sendJson(req, reply, 500, { error: "notification_delivery_failed" });
          }
          return reply.send(out.body);
        } catch (e) {
          req.log.error({ err: e }, "notification delivery test delegate threw");
          return sendJson(req, reply, 500, { error: "notification_delivery_failed" });
        }
      }

      const admin = createServiceSupabase(req.server.env);
      const ok = await assertSlotInBusiness(admin, slotId, businessId);
      if (!ok) return sendJson(req, reply, 404, { error: "not_found" });

      try {
        const body = await loadOpenSlotNotificationDelivery(admin, slotId);
        return reply.send(body);
      } catch (e) {
        req.log.error({ err: e }, "notification delivery failed");
        return sendJson(req, reply, 500, { error: "notification_delivery_failed" });
      }
    },
  );

  app.post(
    "/v1/open-slots",
    { preHandler: requireStaff, config: { rateLimit: rateLimitTier.staffAction } },
    async (req, reply) => {
      const admin = createServiceSupabase(req.server.env);
      const env = req.server.env as Env;
      if (!(await assertStaffBillingCapability(req, reply, admin, env, req.staff!.business_id, "create_openings"))) {
        return;
      }
      const body = createSlotBody.parse(req.body ?? {});

      if (body.payment_required) {
        const connect = await getConnectAccountSnapshot(admin, req.staff!.business_id);
        if (!connect.charges_enabled) {
          return sendJson(req, reply, 403, { error: "business_payouts_not_enabled" });
        }
      }

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

  app.get(
    "/v1/open-slots/:id/no-match-explanation",
    { preHandler: requireStaff, config: { rateLimit: rateLimitTier.directoryRead } },
    async (req, reply) => {
      const admin = createServiceSupabase(req.server.env);
      const id = z.string().uuid().parse((req.params as { id?: string }).id);

      if (!isNoMatchExplanationTestDelegateActive()) {
        const ok = await assertSlotInBusiness(admin, id, req.staff!.business_id);
        if (!ok) return sendJson(req, reply, 404, { error: "not_found" });
      }

      try {
        const payload = await buildNoMatchExplanation(admin, id, req.staff!.business_id);
        return reply.send(payload);
      } catch (err) {
        req.log.error({ err }, "no_match_explanation_failed");
        return sendJson(req, reply, 500, { error: "no_match_explanation_failed" });
      }
    },
  );

  app.post(
    "/v1/open-slots/:id/send-offers",
    { preHandler: requireStaff, config: { rateLimit: rateLimitTier.staffAction } },
    sendOpenSlotOffersRouteHandler,
  );

  app.post(
    "/v1/open-slots/:id/payment-intent",
    { preHandler: requireCustomer, config: { rateLimit: rateLimitTier.strict } },
    async (req, reply) => {
      const env = req.server.env as Env;
      if (!env.ENABLE_CONNECT_ROUTES) return sendJson(req, reply, 503, { error: "connect_unconfigured" });
      const stripe = stripeClientFromEnv(env);
      if (!stripe) return sendJson(req, reply, 503, { error: "connect_unconfigured" });

      const admin = createServiceSupabase(env);
      const openSlotId = z.string().uuid().parse((req.params as { id?: string }).id);

      try {
        const { client_secret, payment_intent_id } = await createSlotClaimPaymentIntent({
          admin,
          stripe,
          env,
          openSlotId,
          customerId: req.customer!.id,
        });
        return reply.send({ client_secret, payment_intent_id });
      } catch (e) {
        const msg = e instanceof Error ? e.message : "payment_intent_failed";
        req.log.warn({ e, openSlotId }, "create_slot_claim_payment_intent_failed");
        if (msg === "slot_not_found") return sendJson(req, reply, 404, { error: "not_found" });
        if (msg === "slot_not_payable") return sendJson(req, reply, 400, { error: "slot_not_payable" });
        if (msg === "slot_not_claimable") return sendJson(req, reply, 409, { error: "slot_not_claimable" });
        if (msg === "business_payouts_not_enabled") {
          return sendJson(req, reply, 503, { error: "business_payouts_not_enabled" });
        }
        return sendJson(req, reply, 500, { error: "payment_intent_failed" });
      }
    },
  );

  app.post(
    "/v1/open-slots/:id/claim",
    { preHandler: requireCustomer, config: { rateLimit: rateLimitTier.strict } },
    async (req, reply) => {
      const admin = createServiceSupabase(req.server.env);
      const env = req.server.env as Env;
      const openSlotId = z.string().uuid().parse((req.params as { id?: string }).id);
      const body = claimBody.parse(req.body ?? {});

      const claimRpcDelegate = getClaimOpenSlotRpcTestDelegate();

      // Confirm with Stripe (source of truth) that the intent actually
      // authorized before letting the RPC's payment gate see it.
      if (body.payment_intent_id && !claimRpcDelegate) {
        const stripe = stripeClientFromEnv(env);
        if (!stripe) return sendJson(req, reply, 503, { error: "connect_unconfigured" });
        try {
          await markSlotClaimPaymentAuthorized({ admin, stripe, paymentIntentId: body.payment_intent_id });
        } catch (e) {
          req.log.warn({ e, paymentIntentId: body.payment_intent_id }, "mark_payment_authorized_failed");
          return sendJson(req, reply, 409, { error: "payment_not_authorized" });
        }
      }

      let data: unknown;
      let error: { message: string } | null = null;
      if (claimRpcDelegate) {
        data = await claimRpcDelegate({
          openSlotId,
          customerId: req.customer!.id,
          deposit_payment_intent_id: body.deposit_payment_intent_id ?? null,
          stripe_payment_intent_id: body.payment_intent_id ?? null,
        });
      } else {
        const rpcOut = await admin.rpc("claim_open_slot", {
          p_open_slot_id: openSlotId,
          p_customer_id: req.customer!.id,
          p_deposit_payment_intent_id: body.deposit_payment_intent_id ?? null,
          p_stripe_payment_intent_id: body.payment_intent_id ?? null,
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
        if (body.payment_intent_id && !claimRpcDelegate) {
          const stripe = stripeClientFromEnv(env);
          if (stripe) {
            try {
              await releaseAuthorizedPaymentByIntentId(admin, stripe, body.payment_intent_id);
            } catch (e) {
              req.log.warn({ e, paymentIntentId: body.payment_intent_id }, "release_payment_after_claim_reject_failed");
            }
          }
        }
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
      const env = req.server.env as Env;
      if (!(await assertStaffBillingCapability(req, reply, admin, env, req.staff!.business_id, "confirm_bookings"))) {
        return;
      }
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
        // Fire-and-forget: push delivery must not block the confirm response.
        notifyCustomerBookingConfirmed({
          env: req.server.env,
          supabase: admin,
          businessId: req.staff!.business_id,
          claimId: body.claim_id,
        }).catch((e) => {
          req.log.warn({ e, claimId: body.claim_id }, "customer_booking_confirmed_notification_failed");
        });
        return sendConfirmSuccess(reply, {
          ok: true,
          result: "confirmed",
          open_slot_id: slotId,
          claim_id: body.claim_id,
          status: "booked",
          message: "Booking confirmed.",
        });
      }

      const { data, error } = await admin.rpc("confirm_open_slot_claim_start_capture", {
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

      const result = data as {
        ok?: boolean;
        error?: string;
        status?: string;
        requires_capture?: boolean;
        payment_intent_id?: string;
      };
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

      if (result.requires_capture) {
        const env = req.server.env as Env;
        const stripe = stripeClientFromEnv(env);
        if (!stripe) {
          await admin.rpc("confirm_open_slot_claim_finalize", {
            p_open_slot_id: slotId,
            p_claim_id: body.claim_id,
            p_capture_ok: false,
            p_failure_reason: "stripe_not_configured",
            p_terminal: false,
          });
          return sendActionError(req, reply, 503, "server_error", "Payments are not configured.", true);
        }

        try {
          await captureStripePaymentIntent(stripe, result.payment_intent_id!);
        } catch (e) {
          req.log.warn({ e, claimId: body.claim_id }, "confirm_capture_failed");
          const reason = e instanceof Error ? e.message : "capture_failed";
          await admin.rpc("confirm_open_slot_claim_finalize", {
            p_open_slot_id: slotId,
            p_claim_id: body.claim_id,
            p_capture_ok: false,
            p_failure_reason: reason,
            p_terminal: false,
          });
          return sendActionError(
            req,
            reply,
            409,
            "payment_capture_failed",
            "Could not charge the customer's card. You can try confirming again.",
            true,
          );
        }

        const { data: finalizeData, error: finalizeErr } = await admin.rpc("confirm_open_slot_claim_finalize", {
          p_open_slot_id: slotId,
          p_claim_id: body.claim_id,
          p_capture_ok: true,
        });
        if (finalizeErr || !(finalizeData as { ok?: boolean } | null)?.ok) {
          req.log.error({ finalizeErr, finalizeData }, "confirm_finalize_after_capture_failed");
          return sendActionError(
            req,
            reply,
            500,
            "server_error",
            "Payment captured but the booking could not be finalized. Contact support.",
            true,
          );
        }
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

      // Fire-and-forget: push delivery must not block the confirm response.
      notifyCustomerBookingConfirmed({
        env: req.server.env,
        supabase: admin,
        businessId: req.staff!.business_id,
        claimId: body.claim_id,
      }).catch((e) => {
        req.log.warn({ e, claimId: body.claim_id }, "customer_booking_confirmed_notification_failed");
      });

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
    "/v1/open-slots/:id/refund",
    { preHandler: requireStaff, config: { rateLimit: rateLimitTier.staffAction } },
    async (req, reply) => {
      const env = req.server.env as Env;
      const admin = createServiceSupabase(env);
      const slotId = z.string().uuid().parse((req.params as { id?: string }).id);
      const parsed = confirmBody.safeParse(req.body ?? {});
      if (!parsed.success) {
        return sendActionError(req, reply, 400, "invalid_request", "A valid claim ID is required.", false);
      }

      const stripe = stripeClientFromEnv(env);
      if (!stripe) {
        return sendActionError(req, reply, 503, "server_error", "Payments are not configured.", true);
      }

      const { data, error } = await admin.rpc("refund_slot_claim_payment", {
        p_claim_id: parsed.data.claim_id,
        p_staff_auth_user_id: req.authUser!.id,
      });
      if (error) {
        req.log.error({ error }, "refund_slot_claim_payment rpc failed");
        return sendActionError(req, reply, 500, "server_error", "Could not refund this booking.", true);
      }

      const result = data as { ok?: boolean; error?: string; payment_intent_id?: string };
      if (!result?.ok) {
        if (result?.error === "forbidden") {
          return sendActionError(
            req,
            reply,
            403,
            "forbidden",
            "You do not have access to refund this booking.",
            false,
          );
        }
        return sendActionError(
          req,
          reply,
          404,
          "not_found",
          "No captured payment found for this claim.",
          false,
        );
      }

      try {
        await refundStripePayment(stripe, result.payment_intent_id!);
      } catch (e) {
        req.log.error({ e, claimId: parsed.data.claim_id }, "stripe_refund_failed");
        return sendActionError(
          req,
          reply,
          502,
          "server_error",
          "Refund recorded but Stripe could not be reached. Contact support.",
          true,
        );
      }

      await admin.from("audit_events").insert({
        business_id: req.staff!.business_id,
        actor_type: "staff",
        actor_id: req.staff!.id,
        event_type: "payment_refunded",
        entity_type: "open_slot",
        entity_id: slotId,
        metadata: mergeMetadata({ claim_id: parsed.data.claim_id }, req.authUser!.id),
      });

      return reply.send({ ok: true, claim_id: parsed.data.claim_id, status: "refunded" });
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
