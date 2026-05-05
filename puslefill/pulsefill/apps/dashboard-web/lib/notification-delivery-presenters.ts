import type { NotificationDeliveryItem, NotificationDeliveryItemStatus, NotificationDeliveryReason } from "@/types/notification-delivery";

export function presentDeliveryStatus(status: NotificationDeliveryItemStatus): string {
  switch (status) {
    case "sent":
      return "Sent";
    case "failed":
      return "Failed";
    case "skipped":
      return "Skipped";
    case "simulated":
      return "Simulated";
    default:
      return status;
  }
}

export function presentDeliveryReason(reason: NotificationDeliveryReason): string {
  switch (reason) {
    case "push_disabled":
      return "Push disabled";
    case "apns_not_configured":
      return "APNs not configured";
    case "device_inactive":
      return "Device inactive";
    case "unknown":
      return "—";
    default:
      return reason;
  }
}

export function presentDeliveryChannel(channel: string): string {
  const c = (channel ?? "").toLowerCase();
  if (c === "push") return "Push";
  if (c === "sms") return "SMS";
  if (c === "email") return "Email";
  if (!c) return "—";
  return channel.charAt(0).toUpperCase() + channel.slice(1).toLowerCase();
}

export function sortDeliveryItemsForDisplay(items: NotificationDeliveryItem[]): NotificationDeliveryItem[] {
  return [...items].sort((a, b) => (a.created_at < b.created_at ? 1 : a.created_at > b.created_at ? -1 : 0));
}
