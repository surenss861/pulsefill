import { describe, expect, it } from "vitest";
import { buildCustomerPushFromCustomerEvent } from "./customer-push-from-event.js";
import { buildCustomerPushPayload } from "./customer-push-payload.js";

describe("customer push payload contract", () => {
  it("nested data uses snake_case ids and type", () => {
    const root = buildCustomerPushPayload({
      type: "booking_confirmed",
      title: "Booking confirmed",
      body: "Done.",
      claimId: "claim-1",
      openSlotId: "slot-1",
    });
    expect(root.aps.alert.title).toBe("Booking confirmed");
    expect(root.data).toMatchObject({
      type: "booking_confirmed",
      claim_id: "claim-1",
      open_slot_id: "slot-1",
    });
    expect(root.data).not.toHaveProperty("claimId");
    expect(root.data).not.toHaveProperty("openSlotId");
  });

  it("buildCustomerPushFromCustomerEvent wires copy + envelope", () => {
    const root = buildCustomerPushFromCustomerEvent({
      kind: "offer_received",
      businessName: "Yorkville Clinic",
      offerId: "o1",
      openSlotId: "s1",
    });
    expect(root.data.type).toBe("offer_received");
    expect(root.data).toMatchObject({ offer_id: "o1", open_slot_id: "s1" });
    expect(root.aps.alert.body).toContain("Yorkville Clinic");
  });

  it("defaults clinic label when business name missing", () => {
    const root = buildCustomerPushFromCustomerEvent({
      kind: "offer_received",
      offerId: "o1",
    });
    expect(root.aps.alert.body).toContain("Clinic has a matching opening");
  });
});
