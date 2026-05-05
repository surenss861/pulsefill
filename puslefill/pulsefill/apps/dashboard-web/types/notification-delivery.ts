export type NotificationDeliveryItemStatus = "sent" | "failed" | "skipped" | "simulated";

export type NotificationDeliveryReason =
  | "push_disabled"
  | "apns_not_configured"
  | "device_inactive"
  | "unknown";

export type NotificationDeliveryItem = {
  id: string;
  customer_label: string;
  channel: string;
  status: NotificationDeliveryItemStatus;
  reason: NotificationDeliveryReason;
  created_at: string;
  offer_id: string | null;
};

export type NotificationDeliveryResponse = {
  open_slot_id: string;
  summary: {
    sent: number;
    failed: number;
    skipped: number;
    simulated: number;
  };
  items: NotificationDeliveryItem[];
};
