import type { PushDecision } from "./push-decision.js";
import type { PushProviderResult } from "./provider-result.js";
import { recordNotificationAttempt, type SupabaseClientLike as RecordSupabaseClientLike } from "./record-notification-attempt.js";
import {
  updateNotificationAttemptResult,
  type SupabaseClientLike as UpdateSupabaseClientLike,
} from "./update-notification-attempt-result.js";
import type { PushProviderAdapter } from "./test-push-provider.js";

type NotificationsSupabaseClientLike = RecordSupabaseClientLike & UpdateSupabaseClientLike;

export type ProcessPushDecisionResult =
  | {
      status: "suppressed";
      recorded: boolean;
      attempt_id?: string;
      dedupe_key?: string;
      reason?: string;
      retryable?: boolean;
    }
  | {
      status: "skipped";
      recorded: false;
      skipped_reason: "missing_payload" | "duplicate";
      dedupe_key?: string;
    }
  | {
      status: "sent" | "failed";
      recorded: true;
      attempt_id: string;
      dedupe_key: string;
      provider_result: PushProviderResult;
    };

export async function processPushDecision(input: {
  supabase: NotificationsSupabaseClientLike;
  decision: PushDecision;
  provider: PushProviderAdapter;
}): Promise<ProcessPushDecisionResult> {
  const recordResult = await recordNotificationAttempt({
    supabase: input.supabase,
    decision: input.decision,
  });

  if (!recordResult.recorded) {
    return {
      status: "skipped",
      recorded: false,
      skipped_reason: recordResult.skipped_reason ?? "missing_payload",
      dedupe_key: recordResult.dedupe_key,
    };
  }

  if (!input.decision.ok) {
    return {
      status: "suppressed",
      recorded: true,
      attempt_id: recordResult.attempt_id,
      dedupe_key: recordResult.dedupe_key,
      reason: input.decision.reason,
      retryable: input.decision.retryable,
    };
  }

  const providerResult = await input.provider.send({
    payload: input.decision.payload,
    device_token: input.decision.device_token,
    dedupe_key: input.decision.dedupe_key,
  });

  await updateNotificationAttemptResult({
    supabase: input.supabase,
    attemptId: recordResult.attempt_id ?? "",
    result: providerResult,
  });

  return {
    status: providerResult.ok ? "sent" : "failed",
    recorded: true,
    attempt_id: recordResult.attempt_id ?? "",
    dedupe_key: recordResult.dedupe_key ?? input.decision.dedupe_key,
    provider_result: providerResult,
  };
}
