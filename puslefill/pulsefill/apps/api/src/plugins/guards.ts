import type { FastifyReply, FastifyRequest } from "fastify";
import { createServiceSupabase } from "../config/supabase.js";

export async function requireAuth(req: FastifyRequest, reply: FastifyReply) {
  if (!req.authUser) {
    return reply.status(401).send({ error: "unauthorized" });
  }
}

export async function requireStaff(req: FastifyRequest, reply: FastifyReply) {
  await requireAuth(req, reply);
  if (reply.sent) return;

  const admin = createServiceSupabase(req.server.env);
  const { data: rows, error } = await admin
    .from("staff_users")
    .select("id, business_id, role")
    .eq("auth_user_id", req.authUser!.id);

  if (error || !rows?.length) {
    return reply.status(403).send({ error: "staff_required" });
  }

  const q = req.query as { business_id?: string };
  let row = rows[0]!;
  if (rows.length > 1) {
    if (!q.business_id) {
      return reply.status(400).send({ error: "business_id_required" });
    }
    const found = rows.find((r) => r.business_id === q.business_id);
    if (!found) {
      return reply.status(403).send({ error: "forbidden_business" });
    }
    row = found;
  }

  req.staff = { id: row.id, business_id: row.business_id, role: row.role };
}

export async function requireCustomer(req: FastifyRequest, reply: FastifyReply) {
  await requireAuth(req, reply);
  if (reply.sent) return;

  const admin = createServiceSupabase(req.server.env);
  const { data, error } = await admin
    .from("customers")
    .select("id")
    .eq("auth_user_id", req.authUser!.id)
    .maybeSingle();

  if (error) {
    return reply.status(500).send({ error: "customer_lookup_failed" });
  }
  if (!data) {
    return reply.status(403).send({ error: "customer_profile_required" });
  }

  req.customer = { id: data.id };
}
