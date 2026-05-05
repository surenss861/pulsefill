import assert from "node:assert/strict";
import test from "node:test";

import {
  mapDeliveryStatusAndReason,
  mapNotificationLogRowToDelivery,
  summarizeDeliveryItems,
  type NotificationDeliveryLogRow,
} from "./open-slot-notification-delivery.js";

function row(overrides: Partial<NotificationDeliveryLogRow>): NotificationDeliveryLogRow {
  return {
    id: "log-1",
    customer_id: "cust-1",
    slot_offer_id: "offer-1",
    channel: "push",
    status: "delivered",
    metadata: {},
    created_at: "2026-04-30T12:00:00.000Z",
    ...overrides,
  };
}

test("mapDeliveryStatusAndReason maps APNs delivered to sent", () => {
  assert.deepEqual(mapDeliveryStatusAndReason(row({ metadata: { delivery_mode: "apns" } })), {
    status: "sent",
    reason: "unknown",
  });
});

test("mapDeliveryStatusAndReason maps push disabled skip to skipped / push_disabled", () => {
  assert.deepEqual(
    mapDeliveryStatusAndReason(
      row({ status: "delivered", metadata: { delivery_mode: "skipped", skip_reason: "customer_push_disabled" } }),
    ),
    { status: "skipped", reason: "push_disabled" },
  );
});

test("mapDeliveryStatusAndReason maps simulated delivery to simulated / apns_not_configured", () => {
  assert.deepEqual(
    mapDeliveryStatusAndReason(
      row({ status: "delivered", metadata: { delivery_mode: "simulated", reason: "apns_not_configured" } }),
    ),
    { status: "simulated", reason: "apns_not_configured" },
  );
});

test("mapDeliveryStatusAndReason maps device-related failures", () => {
  assert.deepEqual(mapDeliveryStatusAndReason(row({ status: "failed", metadata: { reason: "no_push_device" } })), {
    status: "failed",
    reason: "device_inactive",
  });
  assert.deepEqual(
    mapDeliveryStatusAndReason(row({ status: "failed", metadata: { reason: "apns_all_devices_failed" } })),
    { status: "failed", reason: "device_inactive" },
  );
});

test("summarizeDeliveryItems counts statuses", () => {
  const items = [
    mapNotificationLogRowToDelivery(row({ id: "1", metadata: { delivery_mode: "apns" } }), "A"),
    mapNotificationLogRowToDelivery(
      row({ id: "2", status: "delivered", metadata: { delivery_mode: "skipped", skip_reason: "customer_push_disabled" } }),
      "B",
    ),
    mapNotificationLogRowToDelivery(
      row({ id: "3", status: "delivered", metadata: { delivery_mode: "simulated" } }),
      "C",
    ),
    mapNotificationLogRowToDelivery(row({ id: "4", status: "failed", metadata: { reason: "apns_all_devices_failed" } }), "D"),
  ];
  assert.deepEqual(summarizeDeliveryItems(items), {
    sent: 1,
    failed: 1,
    skipped: 1,
    simulated: 1,
  });
});

test("mapNotificationLogRowToDelivery never embeds metadata in the item", () => {
  const item = mapNotificationLogRowToDelivery(
    row({ metadata: { apns_attempts: [{ ok: true }], delivery_mode: "apns" } }),
    "Pat",
  );
  assert.equal(item.customer_label, "Pat");
  assert.equal(item.status, "sent");
  assert.ok(!("metadata" in item));
});
