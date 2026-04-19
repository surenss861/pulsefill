import type { NotificationLogRow } from "@/types/notification-log";

export function presentNotificationReason(log: NotificationLogRow): string | null {
  const reason = typeof log.metadata?.reason === "string" ? log.metadata.reason : null;
  if (!reason) return null;

  switch (reason) {
    case "customer_missing":
      return "Customer record missing";
    case "no_push_device":
      return "No push device registered";
    case "push_delivery_failed":
      return "Push delivery failed";
    default:
      return reason.replaceAll("_", " ");
  }
}

export function presentNotificationDeliveryMode(log: NotificationLogRow): string | null {
  const mode = typeof log.metadata?.delivery_mode === "string" ? log.metadata.delivery_mode : null;
  if (!mode) return null;
  if (mode === "apns") return "APNs";
  if (mode === "simulated") return "Simulated";
  return mode;
}

function capitalizeChannel(ch: string): string {
  if (!ch) return "Notification";
  return ch.charAt(0).toUpperCase() + ch.slice(1).toLowerCase();
}

/** Single scannable line: what happened, plain language. */
export function notificationLogHeadline(log: NotificationLogRow): string {
  const ch = capitalizeChannel(log.channel);
  const st = (log.status ?? "").toLowerCase();
  const mode = presentNotificationDeliveryMode(log);
  const reason = presentNotificationReason(log);

  if (st === "delivered") {
    return mode
      ? `${ch} delivered · ${mode === "Simulated" ? "simulated delivery" : mode}`
      : `${ch} delivered`;
  }
  if (st === "failed") {
    return reason ? `${ch} failed — ${reason}` : `${ch} failed`;
  }
  if (st === "queued") return `${ch} queued for delivery`;
  if (st === "skipped_no_queue") {
    return `${ch} not queued — worker/Redis unavailable, check infrastructure`;
  }
  return `${ch} · ${log.status}`;
}

export type NotificationLogTone = "good" | "bad" | "warn" | "neutral";

export function notificationLogTone(log: NotificationLogRow): NotificationLogTone {
  const st = (log.status ?? "").toLowerCase();
  if (st === "failed") return "bad";
  if (st === "skipped_no_queue") return "warn";
  if (st === "delivered") return "good";
  return "neutral";
}

/** Sort: problems first, then queued, then delivered. */
export function notificationLogSortKey(log: NotificationLogRow): number {
  const st = (log.status ?? "").toLowerCase();
  if (st === "failed") return 0;
  if (st === "skipped_no_queue") return 1;
  if (st === "queued") return 2;
  if (st === "delivered") return 4;
  return 3;
}
