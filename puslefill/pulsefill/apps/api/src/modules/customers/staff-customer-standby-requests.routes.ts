import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import type { Env } from "../../config/env.js";
import { createServiceSupabase } from "../../config/supabase.js";
import { assertStaffBillingCapability } from "../billing/billing-guard.js";
import { sendJson } from "../../lib/http-errors.js";
import { requireStaff } from "../../plugins/guards.js";
import { rateLimitTier } from "../../plugins/rate-limit.js";
import { upsertActiveCustomerMembership } from "./membership.js";

const reviewBody = z
  .object({
    decision: z.enum(["approve", "decline"]),
  })
  .strict();

const STANDBY_REQUEST_BASES = [
  "/v1/businesses/mine/customer-standby-requests",
  "/v1/businesses/mine/standby-requests",
] as const;

/** “Maya R.” style label for staff review surfaces (no raw auth ids). */
export function staffFacingCustomerName(
  fullName: string | null | undefined,
  email: string | null | undefined,
): string | null {
  const fn = fullName?.trim();
  if (fn) {
    const parts = fn.split(/\s+/).filter(Boolean);
    if (parts.length === 0) return null;
    if (parts.length === 1) return parts[0] ?? null;
    const first = parts[0] ?? "";
    const last = parts[parts.length - 1] ?? "";
    const initial = last.length > 0 ? `${last[0]}.` : "";
    return `${first} ${initial}`.trim();
  }
  const em = email?.trim();
  if (!em) return null;
  const at = em.indexOf("@");
  return at > 0 ? em.slice(0, at) : em;
}

async function listStandbyRequestsHandler(req: FastifyRequest, reply: FastifyReply) {
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
    return sendJson(req, reply, 500, { error: "list_failed" });
  }

  const list = rows ?? [];
  const customerIds = [...new Set(list.map((r) => (r as { customer_id: string }).customer_id))];
  const customerById = new Map<string, { email: string | null; full_name: string | null }>();
  if (customerIds.length > 0) {
    const { data: custs } = await admin.from("customers").select("id, email, full_name").in("id", customerIds);
    for (const c of custs ?? []) {
      const row = c as { id: string; email: string | null; full_name: string | null };
      customerById.set(row.id, { email: row.email, full_name: row.full_name });
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
    const cust = customerById.get(row.customer_id);
    const email = cust?.email ?? null;
    const fullName = cust?.full_name ?? null;
    const label = email ?? fullName ?? row.customer_id;
    return {
      ...row,
      business_id: businessId,
      created_at: row.requested_at,
      customer_name: staffFacingCustomerName(fullName, email),
      customer_email: email,
      customer_label: label,
    };
  });

  return reply.send({ requests });
}

async function reviewStandbyRequest(
  req: FastifyRequest,
  reply: FastifyReply,
  requestId: string,
  decision: "approve" | "decline",
) {
  const admin = createServiceSupabase(req.server.env);
  const env = req.server.env as Env;
  if (!(await assertStaffBillingCapability(req, reply, admin, env, req.staff!.business_id, "review_standby_requests"))) {
    return;
  }
  const businessId = req.staff!.business_id;
  const staffId = req.staff!.id;
  const now = new Date().toISOString();

  const { data: row, error: fetchErr } = await admin
    .from("customer_standby_requests")
    .select("id, business_id, customer_id, status")
    .eq("id", requestId)
    .maybeSingle();

  if (fetchErr || !row) {
    return sendJson(req, reply, 404, { error: "not_found" });
  }
  const r = row as { id: string; business_id: string; customer_id: string; status: string };
  if (r.business_id !== businessId) {
    return sendJson(req, reply, 404, { error: "not_found" });
  }
  if (r.status !== "pending") {
    return sendJson(req, reply, 409, { error: "not_pending" });
  }

  if (decision === "decline") {
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
      return sendJson(req, reply, 500, { error: "update_failed" });
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
    return sendJson(req, reply, 500, { error: "update_failed" });
  }

  const u = updated as { id: string; status: string; customer_id: string };
  try {
    await upsertActiveCustomerMembership(admin, u.customer_id, businessId, "request");
  } catch (e) {
    req.log.error({ e }, "membership after approve");
    return sendJson(req, reply, 500, { error: "membership_failed" });
  }

  return reply.send({ request: updated });
}

export async function registerStaffCustomerStandbyRequestsRoutes(app: FastifyInstance) {
  for (const base of STANDBY_REQUEST_BASES) {
    app.get(base, { preHandler: requireStaff }, listStandbyRequestsHandler);

    app.post<{ Params: { requestId: string } }>(
      `${base}/:requestId/review`,
      { preHandler: requireStaff, config: { rateLimit: rateLimitTier.staffAction } },
      async (req, reply) => {
        const requestId = z.string().uuid().parse(req.params.requestId);
        const body = reviewBody.parse(req.body ?? {});
        return reviewStandbyRequest(req, reply, requestId, body.decision);
      },
    );

    app.post<{ Params: { requestId: string } }>(
      `${base}/:requestId/approve`,
      { preHandler: requireStaff, config: { rateLimit: rateLimitTier.staffAction } },
      async (req, reply) => {
        const requestId = z.string().uuid().parse(req.params.requestId);
        return reviewStandbyRequest(req, reply, requestId, "approve");
      },
    );

    app.post<{ Params: { requestId: string } }>(
      `${base}/:requestId/decline`,
      { preHandler: requireStaff, config: { rateLimit: rateLimitTier.staffAction } },
      async (req, reply) => {
        const requestId = z.string().uuid().parse(req.params.requestId);
        return reviewStandbyRequest(req, reply, requestId, "decline");
      },
    );
  }
}
