import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { createServiceSupabase } from "../../config/supabase.js";
import { sendJson } from "../../lib/http-errors.js";
import { requireAuth } from "../../plugins/guards.js";

const syncBody = z
  .object({
    full_name: z.string().min(1).max(200).optional(),
    phone: z.string().min(5).max(40).optional(),
  })
  .strict();

export async function registerAuthRoutes(app: FastifyInstance) {
  app.get(
    "/v1/auth/me",
    { preHandler: requireAuth },
    async (req) => {
      const admin = createServiceSupabase(req.server.env);
      const uid = req.authUser!.id;

      const [customerRes, staffRes] = await Promise.all([
        admin.from("customers").select("id").eq("auth_user_id", uid).maybeSingle(),
        admin
          .from("staff_users")
          .select("business_id, role, businesses ( id, name )")
          .eq("auth_user_id", uid),
      ]);

      const customerId = customerRes.error ? null : (customerRes.data?.id ?? null);
      const staffRows = staffRes.error || !staffRes.data ? [] : staffRes.data;
      const businesses = staffRows.map((row: Record<string, unknown>) => {
        const rel = row.businesses as { id?: string; name?: string } | { id?: string; name?: string }[] | null;
        const b = Array.isArray(rel) ? rel[0] : rel;
        return {
          business_id: String(row.business_id ?? ""),
          business_name: b?.name ? String(b.name) : "Business",
          role: String(row.role ?? "staff"),
        };
      });

      const hasCustomer = Boolean(customerId);
      const hasStaff = businesses.length > 0;

      return {
        user: {
          id: req.authUser!.id,
          email: req.authUser!.email,
          app_metadata: req.authUser!.app_metadata,
          user_metadata: req.authUser!.user_metadata,
        },
        roles: {
          customer: hasCustomer,
          staff: hasStaff,
        },
        customer: customerId ? { id: customerId } : null,
        staff: hasStaff ? { businesses } : null,
      };
    },
  );

  app.post(
    "/v1/auth/session/sync",
    { preHandler: requireAuth },
    async (req, reply) => {
      const admin = createServiceSupabase(req.server.env);
      const body = syncBody.parse(req.body ?? {});
      const u = req.authUser!;

      const row = {
        auth_user_id: u.id,
        email: u.email ?? null,
        full_name: body.full_name ?? (u.user_metadata?.full_name as string | undefined) ?? null,
        phone: body.phone ?? null,
      };

      const { data, error } = await admin
        .from("customers")
        .upsert(row, { onConflict: "auth_user_id" })
        .select("id")
        .single();

      if (error) {
        req.log.error({ error }, "customer upsert failed");
        return sendJson(req, reply, 500, { error: "sync_failed" });
      }

      return reply.send({ ok: true, synced: true, customer_id: data.id });
    },
  );
}
