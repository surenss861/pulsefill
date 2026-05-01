import type { FastifyReply, FastifyRequest } from "fastify";
import { createServiceSupabase } from "../config/supabase.js";
import { sendPublicError } from "../lib/http-errors.js";

export async function requireAuth(req: FastifyRequest, reply: FastifyReply) {
  if (!req.authUser) {
    return sendPublicError(req, reply, 401, "unauthorized", "Sign in again to continue.");
  }
}

export async function requireStaff(req: FastifyRequest, reply: FastifyReply) {
  await requireAuth(req, reply);
  if (reply.sent) return;

  const isRouteTestPrincipal = req.authUser?.email === "operator-route-test@pulsefill.invalid";
  if (
    process.env.PULSEFILL_API_TEST === "1" &&
    req.headers["x-pulsefill-route-test"] === "1" &&
    isRouteTestPrincipal &&
    process.env.PULSEFILL_TEST_STAFF_ID &&
    process.env.PULSEFILL_TEST_BUSINESS_ID
  ) {
    req.staff = {
      id: process.env.PULSEFILL_TEST_STAFF_ID,
      business_id: process.env.PULSEFILL_TEST_BUSINESS_ID,
      role: "owner",
    };
    return;
  }

  const admin = createServiceSupabase(req.server.env);
  const { data: rows, error } = await admin
    .from("staff_users")
    .select("id, business_id, role")
    .eq("auth_user_id", req.authUser!.id);

  if (error || !rows?.length) {
    return sendPublicError(req, reply, 403, "staff_required", "Staff access is required for this resource.");
  }

  const q = req.query as { business_id?: string };
  let row = rows[0]!;
  if (rows.length > 1) {
    if (!q.business_id) {
      return sendPublicError(
        req,
        reply,
        400,
        "business_id_required",
        "Add business_id to the query string when you belong to multiple businesses.",
      );
    }
    const found = rows.find((r) => r.business_id === q.business_id);
    if (!found) {
      return sendPublicError(req, reply, 403, "forbidden_business", "You do not have access to that business.");
    }
    row = found;
  }

  req.staff = { id: row.id, business_id: row.business_id, role: row.role };
}

export async function requireCustomer(req: FastifyRequest, reply: FastifyReply) {
  await requireAuth(req, reply);
  if (reply.sent) return;

  const isRouteTestPrincipal = req.authUser?.email === "operator-route-test@pulsefill.invalid";
  if (
    process.env.PULSEFILL_API_TEST === "1" &&
    req.headers["x-pulsefill-route-test"] === "1" &&
    isRouteTestPrincipal &&
    process.env.PULSEFILL_TEST_CUSTOMER_ID
  ) {
    req.customer = { id: process.env.PULSEFILL_TEST_CUSTOMER_ID };
    return;
  }

  const admin = createServiceSupabase(req.server.env);
  const { data, error } = await admin
    .from("customers")
    .select("id")
    .eq("auth_user_id", req.authUser!.id)
    .maybeSingle();

  if (error) {
    return sendPublicError(req, reply, 500, "customer_lookup_failed", "Could not load your customer profile.");
  }
  if (!data) {
    return sendPublicError(
      req,
      reply,
      403,
      "customer_profile_required",
      "Complete customer setup before using this feature.",
    );
  }

  req.customer = { id: data.id };
}
