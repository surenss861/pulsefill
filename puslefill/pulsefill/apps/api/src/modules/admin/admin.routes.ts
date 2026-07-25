import type { FastifyInstance } from "fastify";
import { z } from "zod";

import { createServiceSupabase } from "../../config/supabase.js";
import { sendJson } from "../../lib/http-errors.js";
import { requirePlatformAdmin } from "../../plugins/guards.js";
import { rateLimitTier } from "../../plugins/rate-limit.js";
import {
  baseSignalsFromOpenSlotRow,
  buildOperatorAvailableActions,
  buildOperatorSlotQueueContext,
  enrichOperatorSlotDetailSignals,
} from "../slots/operator-slot-detail-context.js";

function maskToken(token: string): string {
  if (token.length <= 8) return "…";
  return `${token.slice(0, 4)}…${token.slice(-4)}`;
}

export async function registerAdminRoutes(app: FastifyInstance) {
  /**
   * Cross-business user lookup by email — checks both the customer and staff
   * tables (a person can be both), and reports which businesses a staff
   * match belongs to. Support's starting point for "what is this user".
   */
  app.get(
    "/v1/admin/users/lookup",
    { preHandler: requirePlatformAdmin, config: { rateLimit: rateLimitTier.staffAction } },
    async (req, reply) => {
      const q = z.object({ email: z.string().email() }).safeParse(req.query);
      if (!q.success) {
        return sendJson(req, reply, 400, { error: "invalid_request", message: "A valid email is required." });
      }
      const email = q.data.email.trim().toLowerCase();
      const admin = createServiceSupabase(req.server.env);

      const [{ data: customer, error: customerErr }, { data: staffRows, error: staffErr }] = await Promise.all([
        admin.from("customers").select("*").ilike("email", email).maybeSingle(),
        admin
          .from("staff_users")
          .select("id, business_id, auth_user_id, role, full_name, email, created_at, businesses(name)")
          .ilike("email", email),
      ]);

      if (customerErr || staffErr) {
        req.log.error({ customerErr, staffErr }, "admin_user_lookup_failed");
        return sendJson(req, reply, 500, { error: "lookup_failed" });
      }

      return reply.send({
        customer: customer ?? null,
        staff: staffRows ?? [],
      });
    },
  );

  /** Recent audit trail for a resolved actor (customer id or staff id). */
  app.get(
    "/v1/admin/actors/:actorId/audit",
    { preHandler: requirePlatformAdmin, config: { rateLimit: rateLimitTier.staffAction } },
    async (req, reply) => {
      const actorId = z.string().uuid().parse((req.params as { actorId?: string }).actorId);
      const limit = Math.min(Number((req.query as { limit?: string }).limit ?? 50) || 50, 200);
      const admin = createServiceSupabase(req.server.env);

      const { data, error } = await admin
        .from("audit_events")
        .select("*")
        .eq("actor_id", actorId)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) return sendJson(req, reply, 500, { error: "audit_lookup_failed" });
      return reply.send({ events: data ?? [] });
    },
  );

  /**
   * Full slot lifecycle, cross-business — same queue-context classification
   * the operator dashboard uses, without the caller needing to belong to
   * that business.
   */
  app.get(
    "/v1/admin/open-slots/:id",
    { preHandler: requirePlatformAdmin, config: { rateLimit: rateLimitTier.staffAction } },
    async (req, reply) => {
      const slotId = z.string().uuid().parse((req.params as { id?: string }).id);
      const admin = createServiceSupabase(req.server.env);

      const { data, error } = await admin
        .from("open_slots")
        .select(
          "*, slot_offers(id, customer_id, channel, status, sent_at, expires_at), slot_claims(id, customer_id, claimed_at, status), slot_claim_payments(id, claim_id, status, amount_cents, application_fee_cents, currency, stripe_payment_intent_id), businesses(name)",
        )
        .eq("id", slotId)
        .maybeSingle();

      if (error) return sendJson(req, reply, 500, { error: "load_failed" });
      if (!data) return sendJson(req, reply, 404, { error: "not_found" });

      const row = data as Record<string, unknown>;
      const businessId = String((row as { business_id: string }).business_id);
      const signalsBase = baseSignalsFromOpenSlotRow(row);
      const signals = await enrichOperatorSlotDetailSignals(admin, businessId, slotId, signalsBase);
      const queue_context = buildOperatorSlotQueueContext(signals);
      const available_actions = buildOperatorAvailableActions(signals, queue_context);

      const [{ data: notificationLogs }, { data: auditEvents }] = await Promise.all([
        admin
          .from("notification_logs")
          .select("*")
          .eq("open_slot_id", slotId)
          .order("created_at", { ascending: false })
          .limit(50),
        admin
          .from("audit_events")
          .select("*")
          .eq("entity_type", "open_slot")
          .eq("entity_id", slotId)
          .order("created_at", { ascending: false })
          .limit(50),
      ]);

      return reply.send({
        slot: row,
        queue_context,
        available_actions,
        notification_logs: notificationLogs ?? [],
        audit_events: auditEvents ?? [],
      });
    },
  );

  /** Payment status inspector — by claim id or Stripe PaymentIntent id. */
  app.get(
    "/v1/admin/payments/lookup",
    { preHandler: requirePlatformAdmin, config: { rateLimit: rateLimitTier.staffAction } },
    async (req, reply) => {
      const q = z
        .object({
          claim_id: z.string().uuid().optional(),
          payment_intent_id: z.string().optional(),
        })
        .refine((v) => v.claim_id || v.payment_intent_id, { message: "claim_id or payment_intent_id is required" })
        .safeParse(req.query);
      if (!q.success) {
        return sendJson(req, reply, 400, { error: "invalid_request", message: "claim_id or payment_intent_id is required." });
      }

      const admin = createServiceSupabase(req.server.env);
      let query = admin.from("slot_claim_payments").select("*, open_slots(id, business_id, starts_at, status)");
      query = q.data.claim_id ? query.eq("claim_id", q.data.claim_id) : query.eq("stripe_payment_intent_id", q.data.payment_intent_id!);

      const { data, error } = await query.maybeSingle();
      if (error) return sendJson(req, reply, 500, { error: "payment_lookup_failed" });
      if (!data) return sendJson(req, reply, 404, { error: "not_found" });
      return reply.send({ payment: data });
    },
  );

  /** Push device registration status for a customer (masked tokens only). */
  app.get(
    "/v1/admin/customers/:customerId/push-devices",
    { preHandler: requirePlatformAdmin, config: { rateLimit: rateLimitTier.staffAction } },
    async (req, reply) => {
      const customerId = z.string().uuid().parse((req.params as { customerId?: string }).customerId);
      const admin = createServiceSupabase(req.server.env);

      const { data, error } = await admin
        .from("customer_push_devices")
        .select("id, platform, environment, active, app_build, device_token, created_at, updated_at")
        .eq("customer_id", customerId)
        .order("updated_at", { ascending: false });

      if (error) return sendJson(req, reply, 500, { error: "push_devices_lookup_failed" });

      const devices = (data ?? []).map((d) => ({
        ...d,
        device_token: maskToken(String((d as { device_token: string }).device_token)),
      }));

      return reply.send({ devices });
    },
  );
}
