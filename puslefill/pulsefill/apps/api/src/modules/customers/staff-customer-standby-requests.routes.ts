import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { createServiceSupabase } from "../../config/supabase.js";
import { requireStaff } from "../../plugins/guards.js";
import { upsertActiveCustomerMembership } from "./membership.js";

const reviewBody = z
  .object({
    decision: z.enum(["approve", "decline"]),
  })
  .strict();

export async function registerStaffCustomerStandbyRequestsRoutes(app: FastifyInstance) {
  app.get(
    "/v1/businesses/mine/customer-standby-requests",
    { preHandler: requireStaff },
    async (req, reply) => {
      const admin = createServiceSupabase(req.server.env);
      const businessId = req.staff!.business_id;
      const q = z
        .object({
          status: z.enum(["pending", "approved", "declined", "cancelled"]).optional(),
        })
        .parse((req.query as Record<string, string | undefined>) ?? {});
      const status = q.status ?? "pending";

      const { data: rows, error } = await admin
        .from("customer_standby_requests")
        .select("id, customer_id, status, message, requested_at, reviewed_at, reviewed_by_staff_id")
        .eq("business_id", businessId)
        .eq("status", status)
        .order("requested_at", { ascending: false })
        .limit(200);

      if (error) {
        req.log.error({ error }, "list standby requests");
        return reply.status(500).send({ error: "list_failed" });
      }

      const list = rows ?? [];
      const customerIds = [...new Set(list.map((r) => (r as { customer_id: string }).customer_id))];
      let emailById: Record<string, string | null> = {};
      if (customerIds.length > 0) {
        const { data: custs } = await admin.from("customers").select("id, email, full_name").in("id", customerIds);
        for (const c of custs ?? []) {
          const row = c as { id: string; email: string | null; full_name: string | null };
          emailById[row.id] = row.email ?? row.full_name ?? null;
        }
      }

      const requests = list.map((r) => {
        const row = r as {
          id: string;
          customer_id: string;
          status: string;
          message: string | null;
          requested_at: string;
          reviewed_at: string | null;
          reviewed_by_staff_id: string | null;
        };
        return {
          ...row,
          customer_label: emailById[row.customer_id] ?? row.customer_id,
        };
      });

      return reply.send({ requests });
    },
  );

  app.post<{ Params: { requestId: string } }>(
    "/v1/businesses/mine/customer-standby-requests/:requestId/review",
    { preHandler: requireStaff },
    async (req, reply) => {
      const requestId = z.string().uuid().parse(req.params.requestId);
      const body = reviewBody.parse(req.body ?? {});
      const admin = createServiceSupabase(req.server.env);
      const businessId = req.staff!.business_id;
      const staffId = req.staff!.id;
      const now = new Date().toISOString();

      const { data: row, error: fetchErr } = await admin
        .from("customer_standby_requests")
        .select("id, business_id, customer_id, status")
        .eq("id", requestId)
        .maybeSingle();

      if (fetchErr || !row) {
        return reply.status(404).send({ error: "not_found" });
      }
      const r = row as { id: string; business_id: string; customer_id: string; status: string };
      if (r.business_id !== businessId) {
        return reply.status(404).send({ error: "not_found" });
      }
      if (r.status !== "pending") {
        return reply.status(409).send({ error: "not_pending" });
      }

      if (body.decision === "decline") {
        const { data: updated, error: upErr } = await admin
          .from("customer_standby_requests")
          .update({
            status: "declined",
            reviewed_at: now,
            reviewed_by_staff_id: staffId,
          })
          .eq("id", requestId)
          .eq("status", "pending")
          .select("id, status")
          .maybeSingle();
        if (upErr || !updated) {
          return reply.status(500).send({ error: "update_failed" });
        }
        return reply.send({ request: updated });
      }

      const { data: updated, error: upErr } = await admin
        .from("customer_standby_requests")
        .update({
          status: "approved",
          reviewed_at: now,
          reviewed_by_staff_id: staffId,
        })
        .eq("id", requestId)
        .eq("status", "pending")
        .select("id, status, customer_id")
        .maybeSingle();

      if (upErr || !updated) {
        return reply.status(500).send({ error: "update_failed" });
      }

      const u = updated as { id: string; status: string; customer_id: string };
      try {
        await upsertActiveCustomerMembership(admin, u.customer_id, businessId, "request");
      } catch (e) {
        req.log.error({ e }, "membership after approve");
        return reply.status(500).send({ error: "membership_failed" });
      }

      return reply.send({ request: updated });
    },
  );
}
