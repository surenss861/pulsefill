import { mapProviderResultToAttemptUpdate, type PushProviderResult } from "./provider-result.js";

type UpdateResult = {
  data: { id: string } | null;
  error: { code?: string; message?: string } | null;
};

export type SupabaseClientLike = {
  from: (table: string) => {
    update: (row: unknown) => {
      eq: (field: string, value: string) => {
        select: (fields: string) => {
          maybeSingle: () => Promise<UpdateResult>;
        };
      };
    };
  };
};

export async function updateNotificationAttemptResult(input: {
  supabase: SupabaseClientLike;
  attemptId: string;
  result: PushProviderResult;
}): Promise<{ updated: boolean; attempt_id: string }> {
  const row = mapProviderResultToAttemptUpdate(input.result);

  const { data, error } = await input.supabase
    .from("notification_delivery_attempts")
    .update(row)
    .eq("id", input.attemptId)
    .select("id")
    .maybeSingle();

  if (error) {
    const code = String(error.code ?? "unknown");
    throw new Error(`update_notification_attempt_failed:${code}`);
  }
  if (!data?.id) {
    throw new Error("update_notification_attempt_failed:not_found");
  }

  return { updated: true, attempt_id: data.id };
}
