export type PushProviderName = "apns" | "expo" | "fcm" | "test";

export type PushProviderResult =
  | {
      ok: true;
      provider: PushProviderName;
      provider_message_id: string;
      sent_at: string;
    }
  | {
      ok: false;
      provider: PushProviderName;
      error_code: string;
      error_message: string;
      failed_at: string;
      retryable: boolean;
    };

export type NotificationDeliveryAttemptUpdate = {
  status: "sent" | "failed";
  provider: PushProviderName;
  provider_message_id: string | null;
  error_code: string | null;
  error_message: string | null;
  updated_at: string;
};

export function mapProviderResultToAttemptUpdate(
  result: PushProviderResult,
): NotificationDeliveryAttemptUpdate {
  if (result.ok) {
    return {
      status: "sent",
      provider: result.provider,
      provider_message_id: result.provider_message_id,
      error_code: null,
      error_message: null,
      updated_at: result.sent_at,
    };
  }

  return {
    status: "failed",
    provider: result.provider,
    provider_message_id: null,
    error_code: result.error_code,
    error_message: result.error_message,
    updated_at: result.failed_at,
  };
}
