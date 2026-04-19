import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { createServiceSupabase } from "../../config/supabase.js";
import { requireStaff } from "../../plugins/guards.js";

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
