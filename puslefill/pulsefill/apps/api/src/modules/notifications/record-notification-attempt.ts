import type { PushDecision } from "./push-decision.js";
import { mapPushDecisionToDeliveryAttempt } from "./push-delivery-attempts.js";

type InsertResult = {
  data: { id: string; dedupe_key: string } | null;
  error: { code?: string; message?: string } | null;
};

export type SupabaseClientLike = {
  from: (table: string) => {
    insert: (row: unknown) => {
      select: (fields: string) => {
        single: () => Promise<InsertResult>;
      };
    };
  };
};

export async function recordNotificationAttempt(input: {
  supabase: SupabaseClientLike;
  decision: PushDecision;
}): Promise<{
  recorded: boolean;
  attempt_id?: string;
  dedupe_key?: string;
  skipped_reason?: "missing_payload" | "duplicate";
}> {
  const row = mapPushDecisionToDeliveryAttempt(input.decision);
  if (!row) {
    return { recorded: false, skipped_reason: "missing_payload" };
  }

  const { data, error } = await input.supabase
    .from("notification_delivery_attempts")
    .insert(row)
    .select("id,dedupe_key")
    .single();

  if (error) {
    const code = String(error.code ?? "");
    const message = String(error.message ?? "").toLowerCase();
    const isDuplicate = code === "23505" || message.includes("duplicate key");
    if (isDuplicate) {
      return {
        recorded: false,
        skipped_reason: "duplicate",
        dedupe_key: row.dedupe_key,
      };
    }
    throw new Error(`record_notification_attempt_failed:${code || "unknown"}`);
  }

  return {
    recorded: true,
    attempt_id: data?.id,
    dedupe_key: data?.dedupe_key ?? row.dedupe_key,
  };
}
