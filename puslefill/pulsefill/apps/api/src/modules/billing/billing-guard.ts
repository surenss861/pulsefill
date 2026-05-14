import type { FastifyReply, FastifyRequest } from "fastify";
import type { SupabaseClient } from "@supabase/supabase-js";

import type { Env } from "../../config/env.js";
import { sendJson } from "../../lib/http-errors.js";
import type { BillingEntitlements } from "./billing-entitlements.js";
import { getBillingSummary } from "./billing-summary.js";

export type StaffBillingCapability =
  | "create_openings"
  | "send_offers"
  | "invite_customers"
  | "review_standby_requests"
  | "confirm_bookings";

type BillingCapabilityKey = keyof Pick<
  BillingEntitlements,
  | "can_create_openings"
  | "can_send_offers"
  | "can_invite_customers"
  | "can_review_standby_requests"
  | "can_confirm_bookings"
>;

const capabilityField: Record<StaffBillingCapability, BillingCapabilityKey> = {
  create_openings: "can_create_openings",
  send_offers: "can_send_offers",
  invite_customers: "can_invite_customers",
  review_standby_requests: "can_review_standby_requests",
  confirm_bookings: "can_confirm_bookings",
};

/**
 * Returns false when the response was already sent (403 billing_inactive).
 * Call after `requireStaff` so `req.staff` is set.
 */
export async function assertStaffBillingCapability(
  req: FastifyRequest,
  reply: FastifyReply,
  admin: SupabaseClient,
  env: Env,
  businessId: string,
  capability: StaffBillingCapability,
): Promise<boolean> {
  if (process.env.PULSEFILL_API_TEST === "1") {
    return true;
  }
  try {
    const summary = await getBillingSummary(admin, businessId, env);
    const field = capabilityField[capability];
    const allowed = Boolean(summary.entitlements[field]);
    if (!allowed) {
      sendJson(req, reply, 403, {
        error: "billing_inactive",
        capability,
        status_reason: summary.entitlements.status_reason,
        notice: summary.entitlements.notice,
      });
      return false;
    }
    return true;
  } catch (e) {
    req.log.error({ e, capability }, "billing_guard_lookup_failed");
    sendJson(req, reply, 500, { error: "billing_lookup_failed" });
    return false;
  }
}
