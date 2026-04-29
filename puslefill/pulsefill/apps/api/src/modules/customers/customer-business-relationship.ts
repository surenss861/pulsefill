import type { SupabaseClient } from "@supabase/supabase-js";

export type CustomerRelationshipState = {
  membership_status: "none" | "active";
  request_status: "none" | "pending" | "declined";
  standby_status: "not_set_up" | "active";
};

export type StandbyIntentResult = "joined" | "request_pending" | "invite_required";

export type StandbyIntentNextStep = "setup_standby" | "wait_for_approval" | "enter_invite" | "edit_preferences";

export async function getCustomerBusinessRelationship(
  admin: SupabaseClient,
  customerId: string,
  businessId: string,
): Promise<CustomerRelationshipState> {
  const { data: mem } = await admin
    .from("customer_business_memberships")
    .select("status")
    .eq("customer_id", customerId)
    .eq("business_id", businessId)
    .maybeSingle();

  const membership_status: CustomerRelationshipState["membership_status"] =
    mem && (mem as { status: string }).status === "active" ? "active" : "none";

  const { data: pendingReq } = await admin
    .from("customer_standby_requests")
    .select("id")
    .eq("customer_id", customerId)
    .eq("business_id", businessId)
    .eq("status", "pending")
    .maybeSingle();

  let request_status: CustomerRelationshipState["request_status"] = "none";
  if (pendingReq) {
    request_status = "pending";
  } else if (membership_status === "none") {
    const { data: latest } = await admin
      .from("customer_standby_requests")
      .select("status")
      .eq("customer_id", customerId)
      .eq("business_id", businessId)
      .order("requested_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    const st = latest ? (latest as { status: string }).status : null;
    if (st === "declined") {
      request_status = "declined";
    }
  }

  const { count, error } = await admin
    .from("standby_preferences")
    .select("id", { count: "exact", head: true })
    .eq("customer_id", customerId)
    .eq("business_id", businessId)
    .eq("active", true);

  const standby_status: CustomerRelationshipState["standby_status"] =
    !error && (count ?? 0) > 0 ? "active" : "not_set_up";

  return { membership_status, request_status, standby_status };
}

export function nextStepFromRelationship(rel: CustomerRelationshipState): StandbyIntentNextStep {
  if (rel.membership_status === "active") {
    return rel.standby_status === "active" ? "edit_preferences" : "setup_standby";
  }
  if (rel.request_status === "pending") {
    return "wait_for_approval";
  }
  return "setup_standby";
}

export type StandbyIntentLegacyOutcome =
  | "already_connected"
  | "joined_standby"
  | "request_submitted"
  | "request_pending"
  | "invite_required";

export function standbyIntentPayload(
  rel: CustomerRelationshipState,
  result: StandbyIntentResult,
  legacyOutcome: StandbyIntentLegacyOutcome,
): {
  result: StandbyIntentResult;
  outcome: StandbyIntentLegacyOutcome;
  membership_status: CustomerRelationshipState["membership_status"];
  request_status: CustomerRelationshipState["request_status"];
  next_step: StandbyIntentNextStep;
} {
  const next_step =
    result === "invite_required"
      ? ("enter_invite" as const)
      : result === "request_pending"
        ? ("wait_for_approval" as const)
        : nextStepFromRelationship(rel);

  return {
    result,
    outcome: legacyOutcome,
    membership_status: rel.membership_status,
    request_status: rel.request_status,
    next_step,
  };
}
