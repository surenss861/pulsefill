import type { PulseFillPushType } from "./push-payloads.js";

export type PushEligibilityFailureReason =
  | "no_customer"
  | "push_disabled"
  | "push_permission_denied"
  | "no_push_device"
  | "quiet_hours"
  | "notification_type_disabled"
  | "missing_required_target"
  | "dedupe_already_sent";

export type PushEligibilityResult =
  | {
      ok: true;
      channel: "push";
      device_token: string;
    }
  | {
      ok: false;
      reason: PushEligibilityFailureReason;
      retryable: boolean;
    };

export type PushEligibilityInput = {
  customer?: {
    id: string;
    push_enabled?: boolean | null;
    push_permission?: "granted" | "denied" | "unknown" | null;
  } | null;
  device?: {
    token?: string | null;
    platform?: "ios" | "android" | "web" | null;
    active?: boolean | null;
  } | null;
  notificationPrefs?: {
    push_enabled?: boolean | null;
    disabled_types?: string[] | null;
    quiet_hours_enabled?: boolean | null;
    quiet_hours_start?: string | null;
    quiet_hours_end?: string | null;
    timezone?: string | null;
  } | null;
  type: PulseFillPushType;
  nowIso: string;
  requiredTarget?: {
    openSlotId?: string | null;
    claimId?: string | null;
    customerId?: string | null;
  };
  dedupeAlreadySent?: boolean;
};

export function evaluatePushEligibility(input: PushEligibilityInput): PushEligibilityResult {
  if (!input.customer) {
    return { ok: false, reason: "no_customer", retryable: false };
  }
  if (input.dedupeAlreadySent) {
    return { ok: false, reason: "dedupe_already_sent", retryable: false };
  }
  if (input.customer.push_enabled === false) {
    return { ok: false, reason: "push_disabled", retryable: false };
  }
  if (input.notificationPrefs?.push_enabled === false) {
    return { ok: false, reason: "push_disabled", retryable: false };
  }
  if (input.customer.push_permission === "denied") {
    return { ok: false, reason: "push_permission_denied", retryable: false };
  }
  if (!input.device?.active || !input.device.token) {
    return { ok: false, reason: "no_push_device", retryable: true };
  }
  if (input.notificationPrefs?.disabled_types?.includes(input.type)) {
    return { ok: false, reason: "notification_type_disabled", retryable: false };
  }
  if (!hasRequiredTarget(input)) {
    return { ok: false, reason: "missing_required_target", retryable: false };
  }
  if (isInQuietHours(input.nowIso, input.notificationPrefs)) {
    return { ok: false, reason: "quiet_hours", retryable: true };
  }
  return {
    ok: true,
    channel: "push",
    device_token: input.device.token,
  };
}

export function hasRequiredTarget(input: PushEligibilityInput): boolean {
  const target = input.requiredTarget ?? {};
  switch (input.type) {
    case "customer_offer_sent":
    case "customer_offer_expiring_soon":
    case "operator_delivery_failure":
      return Boolean(target.openSlotId);
    case "customer_booking_confirmed":
    case "operator_claim_needs_confirmation":
      return Boolean(target.openSlotId && target.claimId);
    case "customer_lost_opportunity":
      return Boolean(target.customerId && target.openSlotId);
    case "customer_standby_setup_suggestion":
    case "customer_standby_status_reminder":
      return Boolean(target.customerId);
    default:
      return false;
  }
}

export function isInQuietHours(nowIso: string, prefs?: PushEligibilityInput["notificationPrefs"]): boolean {
  if (!prefs?.quiet_hours_enabled) return false;
  if (!prefs.quiet_hours_start || !prefs.quiet_hours_end) return false;

  const now = new Date(nowIso);
  if (Number.isNaN(now.getTime())) return false;

  const start = toMinutes(prefs.quiet_hours_start);
  const end = toMinutes(prefs.quiet_hours_end);
  if (start < 0 || end < 0 || start === end) return false;

  const current = now.getHours() * 60 + now.getMinutes();
  if (start > end) return current >= start || current < end;
  return current >= start && current < end;
}

function toMinutes(value: string): number {
  const parts = value.split(":");
  if (parts.length !== 2) return -1;
  const hh = Number(parts[0]);
  const mm = Number(parts[1]);
  if (!Number.isFinite(hh) || !Number.isFinite(mm)) return -1;
  if (hh < 0 || hh > 23 || mm < 0 || mm > 59) return -1;
  return hh * 60 + mm;
}
