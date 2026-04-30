import type { SupabaseClient } from "@supabase/supabase-js";

export type SendOfferChannel = "push" | "sms" | "email";

export type AtomicSendOfferRow = {
  customer_id: string;
  channel: SendOfferChannel;
  expires_at: string;
};

export type AtomicSendOffersInput = {
  openSlotId: string;
  businessId: string;
  staffId: string;
  authUserId: string;
  offerRows: AtomicSendOfferRow[];
  queueEnabled: boolean;
  matchSummary: unknown;
};

export type AtomicNoMatchesInput = {
  openSlotId: string;
  businessId: string;
  staffId: string;
  authUserId: string;
  noMatchesReason: string;
  matchSummary: unknown;
  matchDiagnostics: unknown;
};

export type AtomicOfferCustomer = {
  offer_id: string;
  customer_id: string;
  channel: SendOfferChannel;
};

export type AtomicSendOffersResult =
  | {
      ok: true;
      offer_ids: string[];
      offer_customer_ids: AtomicOfferCustomer[];
    }
  | {
      ok: false;
      error: string;
      status?: string;
    };

export function buildAtomicSendOffersRpcArgs(input: AtomicSendOffersInput) {
  return {
    p_open_slot_id: input.openSlotId,
    p_business_id: input.businessId,
    p_staff_id: input.staffId,
    p_staff_auth_user_id: input.authUserId,
    p_offer_rows: input.offerRows,
    p_queue_enabled: input.queueEnabled,
    p_match_summary: input.matchSummary,
  };
}

export function buildAtomicNoMatchesRpcArgs(input: AtomicNoMatchesInput) {
  return {
    p_open_slot_id: input.openSlotId,
    p_business_id: input.businessId,
    p_staff_id: input.staffId,
    p_staff_auth_user_id: input.authUserId,
    p_no_matches_reason: input.noMatchesReason,
    p_match_summary: input.matchSummary,
    p_match_diagnostics: input.matchDiagnostics,
  };
}

export function parseAtomicSendOffersResult(raw: unknown): AtomicSendOffersResult {
  if (!raw || typeof raw !== "object") {
    return { ok: false, error: "send_offers_failed" };
  }

  const row = raw as Record<string, unknown>;
  if (row.ok !== true) {
    return {
      ok: false,
      error: typeof row.error === "string" ? row.error : "send_offers_failed",
      status: typeof row.status === "string" ? row.status : undefined,
    };
  }

  const offerCustomerIds = Array.isArray(row.offer_customer_ids)
    ? row.offer_customer_ids.flatMap((value): AtomicOfferCustomer[] => {
        if (!value || typeof value !== "object") return [];
        const item = value as Record<string, unknown>;
        const offerId = typeof item.offer_id === "string" ? item.offer_id : "";
        const customerId = typeof item.customer_id === "string" ? item.customer_id : "";
        if (!offerId || !customerId) return [];
        return [{
          offer_id: offerId,
          customer_id: customerId,
          channel: toOfferChannel(item.channel),
        }];
      })
    : [];

  const offerIds = Array.isArray(row.offer_ids)
    ? row.offer_ids.filter((id): id is string => typeof id === "string")
    : offerCustomerIds.map((item) => item.offer_id);

  return {
    ok: true,
    offer_ids: offerIds,
    offer_customer_ids: offerCustomerIds,
  };
}

export async function commitSendOffersAtomically(
  admin: SupabaseClient,
  input: AtomicSendOffersInput,
): Promise<AtomicSendOffersResult> {
  const { data, error } = await admin.rpc("staff_send_open_slot_offers", buildAtomicSendOffersRpcArgs(input));
  if (error) {
    throw new Error(`staff_send_open_slot_offers_failed:${error.code ?? "unknown"}`);
  }
  return parseAtomicSendOffersResult(data);
}

export async function recordNoMatchesAtomically(
  admin: SupabaseClient,
  input: AtomicNoMatchesInput,
): Promise<{ ok: true } | { ok: false; error: string; status?: string }> {
  const { data, error } = await admin.rpc("staff_record_open_slot_no_matches", buildAtomicNoMatchesRpcArgs(input));
  if (error) {
    throw new Error(`staff_record_open_slot_no_matches_failed:${error.code ?? "unknown"}`);
  }
  if (!data || typeof data !== "object" || (data as Record<string, unknown>).ok !== true) {
    const row = (data ?? {}) as Record<string, unknown>;
    return {
      ok: false,
      error: typeof row.error === "string" ? row.error : "record_no_matches_failed",
      status: typeof row.status === "string" ? row.status : undefined,
    };
  }
  return { ok: true };
}

export async function markSendOfferNotificationLogs(
  admin: SupabaseClient,
  input: {
    openSlotId: string;
    offerIds: string[];
    status: "queued" | "skipped_no_queue" | "queue_failed";
    metadata?: Record<string, unknown>;
  },
) {
  if (input.offerIds.length === 0) return;

  await admin
    .from("notification_logs")
    .update({
      status: input.status,
      error: input.status === "queue_failed" ? String(input.metadata?.queue_error ?? "queue_failed") : null,
      metadata: input.metadata ?? {},
    })
    .eq("open_slot_id", input.openSlotId)
    .eq("status", "pending_queue")
    .in("slot_offer_id", input.offerIds);
}

function toOfferChannel(value: unknown): SendOfferChannel {
  if (value === "sms" || value === "email") return value;
  return "push";
}
