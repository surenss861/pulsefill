import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { createServiceSupabase } from "../../config/supabase.js";
import { requireStaff } from "../../plugins/guards.js";
import { buildActionQueue } from "./action-queue.js";
import { buildDailyOpsSummary } from "./daily-ops-summary.js";
import { buildDeliveryReliability } from "./delivery-reliability.js";
import { buildOpsBreakdown } from "./ops-breakdown.js";
import { buildMorningRecoveryDigest } from "./morning-recovery-digest.js";
import { buildOperatorCustomerContext } from "./operator-customer-context.js";

const patchBody = z
  .object({
    name: z.string().min(1).max(200).optional(),
    category: z.string().max(120).optional(),
    timezone: z.string().min(1).max(80).optional(),
    phone: z.string().max(40).optional(),
    email: z.string().email().optional(),
    website: z.string().max(512).optional(),
  })
  .strict();

export async function registerBusinessRoutes(app: FastifyInstance) {
  app.get(
    "/v1/businesses/mine",
    { preHandler: requireStaff },
    async (req, reply) => {
      const admin = createServiceSupabase(req.server.env);
      const { data, error } = await admin
        .from("businesses")
        .select("*")
        .eq("id", req.staff!.business_id)
        .maybeSingle();

      if (error) {
        return reply.status(500).send({ error: "business_lookup_failed" });
      }
      if (!data) {
        return reply.status(404).send({ error: "business_not_found" });
      }
      return reply.send(data);
    },
  );

  app.get(
    "/v1/businesses/mine/metrics",
    { preHandler: requireStaff },
    async (req, reply) => {
      const admin = createServiceSupabase(req.server.env);
      const businessId = req.staff!.business_id;
      const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

      const [slots, booked, revenue, slotRows] = await Promise.all([
        admin
          .from("open_slots")
          .select("id", { count: "exact", head: true })
          .eq("business_id", businessId)
          .gte("created_at", since),
        admin
          .from("open_slots")
          .select("id", { count: "exact", head: true })
          .eq("business_id", businessId)
          .eq("status", "booked")
          .gte("created_at", since),
        admin
          .from("open_slots")
          .select("estimated_value_cents")
          .eq("business_id", businessId)
          .eq("status", "booked")
          .gte("created_at", since),
        admin.from("open_slots").select("id").eq("business_id", businessId).gte("created_at", since),
      ]);

      const slotIds = (slotRows.data ?? []).map((r) => r.id);
      let offersCount = 0;
      if (slotIds.length > 0) {
        const { count } = await admin
          .from("slot_offers")
          .select("id", { count: "exact", head: true })
          .in("open_slot_id", slotIds)
          .gte("sent_at", since);
        offersCount = count ?? 0;
      }

      const recoveredRevenueCents =
        revenue.data?.reduce((acc, r) => acc + (r.estimated_value_cents ?? 0), 0) ?? 0;

      return reply.send({
        window_days: 30,
        open_slots_created: slots.count ?? 0,
        offers_sent: offersCount,
        slots_booked: booked.count ?? 0,
        recovered_revenue_cents: recoveredRevenueCents,
      });
    },
  );

  app.get(
    "/v1/businesses/mine/action-queue",
    { preHandler: requireStaff },
    async (req, reply) => {
      const admin = createServiceSupabase(req.server.env);
      try {
        const data = await buildActionQueue(admin, req.staff!.business_id);
        return reply.send(data);
      } catch (e) {
        req.log.error({ e }, "action_queue_failed");
        return reply.status(500).send({ error: "action_queue_failed" });
      }
    },
  );

  app.get(
    "/v1/businesses/mine/morning-recovery-digest",
    { preHandler: requireStaff },
    async (req, reply) => {
      const admin = createServiceSupabase(req.server.env);
      try {
        const data = await buildMorningRecoveryDigest(admin, req.staff!.business_id);
        return reply.send(data);
      } catch (e) {
        req.log.error({ e }, "morning_recovery_digest_failed");
        return reply.status(500).send({ error: "morning_recovery_digest_failed" });
      }
    },
  );

  app.get(
    "/v1/businesses/mine/daily-ops-summary",
    { preHandler: requireStaff },
    async (req, reply) => {
      const admin = createServiceSupabase(req.server.env);
      try {
        const data = await buildDailyOpsSummary(admin, req.staff!.business_id);
        return reply.send(data);
      } catch (e) {
        req.log.error({ e }, "daily_ops_summary_failed");
        return reply.status(500).send({ error: "daily_ops_summary_failed" });
      }
    },
  );

  app.get(
    "/v1/businesses/mine/ops-breakdown",
    { preHandler: requireStaff },
    async (req, reply) => {
      const admin = createServiceSupabase(req.server.env);
      try {
        const data = await buildOpsBreakdown(admin, req.staff!.business_id);
        return reply.send(data);
      } catch (e) {
        req.log.error({ e }, "ops_breakdown_failed");
        return reply.status(500).send({ error: "ops_breakdown_failed" });
      }
    },
  );

  app.get(
    "/v1/businesses/mine/delivery-reliability",
    { preHandler: requireStaff },
    async (req, reply) => {
      const admin = createServiceSupabase(req.server.env);
      try {
        const data = await buildDeliveryReliability(admin, req.staff!.business_id);
        return reply.send(data);
      } catch (e) {
        req.log.error({ e }, "delivery_reliability_failed");
        return reply.status(500).send({ error: "delivery_reliability_failed" });
      }
    },
  );

  app.get(
    "/v1/businesses/mine/customers/:customerId/context",
    { preHandler: requireStaff },
    async (req, reply) => {
      const admin = createServiceSupabase(req.server.env);
      const customerId = z.string().uuid().parse((req.params as { customerId?: string }).customerId);

      try {
        const result = await buildOperatorCustomerContext(admin, req.staff!.business_id, customerId);
        if ("error" in result) {
          if (result.error === "not_found") {
            return reply.status(404).send({ error: "customer_not_found" });
          }
          return reply.status(403).send({ error: "customer_context_forbidden" });
        }
        return reply.send(result);
      } catch (e) {
        req.log.error({ e }, "operator_customer_context_failed");
        return reply.status(500).send({ error: "operator_customer_context_failed" });
      }
    },
  );

  app.get(
    "/v1/businesses/mine/live-counts",
    { preHandler: requireStaff },
    async (req, reply) => {
      const admin = createServiceSupabase(req.server.env);
      const businessId = req.staff!.business_id;

      const { data, error } = await admin.from("open_slots").select("status").eq("business_id", businessId);

      if (error) {
        req.log.error({ error }, "live counts failed");
        return reply.status(500).send({ error: "live_counts_failed" });
      }

      const rows = data ?? [];
      const claimedCount = rows.filter((row) => row.status === "claimed").length;
      const openCount = rows.filter((row) => row.status === "open" || row.status === "offered").length;

      return reply.send({
        counts: {
          claimed: claimedCount,
          open: openCount,
        },
      });
    },
  );

  app.patch(
    "/v1/businesses/mine",
    { preHandler: requireStaff },
    async (req, reply) => {
      const admin = createServiceSupabase(req.server.env);
      const body = patchBody.parse(req.body ?? {});

      const { data, error } = await admin
        .from("businesses")
        .update(body)
        .eq("id", req.staff!.business_id)
        .select("*")
        .maybeSingle();

      if (error) {
        return reply.status(500).send({ error: "business_update_failed" });
      }
      return reply.send(data);
    },
  );
}
