import type { SupabaseClient } from "@supabase/supabase-js";

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

export type NotificationDeliveryLogRow = {
  id: string;
  customer_id: string | null;
  slot_offer_id: string | null;
  channel: string;
  status: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

export function mapDeliveryStatusAndReason(log: NotificationDeliveryLogRow): {
  status: NotificationDeliveryItemStatus;
  reason: NotificationDeliveryReason;
} {
  const st = String(log.status ?? "").toLowerCase();
  const m = log.metadata ?? {};
  const deliveryMode = typeof m.delivery_mode === "string" ? m.delivery_mode.toLowerCase() : null;
  const skipReason = typeof m.skip_reason === "string" ? m.skip_reason.toLowerCase() : null;
  const failureReason = typeof m.reason === "string" ? m.reason.toLowerCase() : null;

  if (st === "failed") {
    if (failureReason === "no_push_device") return { status: "failed", reason: "device_inactive" };
    if (failureReason === "apns_all_devices_failed") return { status: "failed", reason: "device_inactive" };
    return { status: "failed", reason: "unknown" };
  }

  if (st === "delivered") {
    if (deliveryMode === "skipped" || skipReason === "customer_push_disabled") {
      return { status: "skipped", reason: "push_disabled" };
    }
    if (deliveryMode === "simulated") {
      return { status: "simulated", reason: "apns_not_configured" };
    }
    return { status: "sent", reason: "unknown" };
  }

  return { status: "skipped", reason: "unknown" };
}

export function mapNotificationLogRowToDelivery(
  log: NotificationDeliveryLogRow,
  customerLabel: string,
): NotificationDeliveryItem {
  const { status, reason } = mapDeliveryStatusAndReason(log);
  return {
    id: log.id,
    customer_label: customerLabel,
    channel: String(log.channel ?? "push"),
    status,
    reason,
    created_at: log.created_at,
    offer_id: log.slot_offer_id,
  };
}

export function summarizeDeliveryItems(items: NotificationDeliveryItem[]): NotificationDeliveryResponse["summary"] {
  return {
    sent: items.filter((i) => i.status === "sent").length,
    failed: items.filter((i) => i.status === "failed").length,
    skipped: items.filter((i) => i.status === "skipped").length,
    simulated: items.filter((i) => i.status === "simulated").length,
  };
}

function customerDisplayLabel(row: { full_name?: string | null; email?: string | null } | null | undefined): string {
  const name = row?.full_name?.trim();
  if (name) return name;
  const email = row?.email?.trim();
  if (email) {
    const local = email.split("@")[0]?.trim();
    if (local) return local;
  }
  return "Customer";
}

export async function loadOpenSlotNotificationDelivery(
  admin: SupabaseClient,
  openSlotId: string,
): Promise<NotificationDeliveryResponse> {
  const { data, error } = await admin
    .from("notification_logs")
    .select("id, customer_id, slot_offer_id, channel, status, metadata, created_at")
    .eq("open_slot_id", openSlotId)
    .order("created_at", { ascending: false });

  if (error) throw new Error("notification_delivery_load_failed");

  const logs = (data ?? []) as NotificationDeliveryLogRow[];
  const customerIds = [...new Set(logs.map((l) => l.customer_id).filter((id): id is string => Boolean(id)))];
  const labels = new Map<string, string>();
  if (customerIds.length > 0) {
    const { data: customers, error: cErr } = await admin
      .from("customers")
      .select("id, full_name, email")
      .in("id", customerIds);
    if (!cErr && customers) {
      for (const c of customers as Array<{ id: string; full_name?: string | null; email?: string | null }>) {
        labels.set(c.id, customerDisplayLabel(c));
      }
    }
  }

  const items = logs.map((log) =>
    mapNotificationLogRowToDelivery(log, log.customer_id ? (labels.get(log.customer_id) ?? "Customer") : "Customer"),
  );

  return {
    open_slot_id: openSlotId,
    summary: summarizeDeliveryItems(items),
    items,
  };
}
