import { describe, expect, it } from "vitest";

import { buildCustomerOfferSentPushFields } from "./customer-offer-sent-push.js";

describe("buildCustomerOfferSentPushFields", () => {
  const base = {
    businessId: "22222222-2222-4222-8222-222222222222",
    customerId: "33333333-3333-4333-8333-333333333333",
    openSlotId: "44444444-4444-4444-8444-444444444444",
    offerId: "55555555-5555-4555-8555-555555555555",
    createdAt: "2026-04-25T12:00:00.000Z",
  };

  it("uses customer-safe title with Opening language (not Offer as product headline)", () => {
    const f = buildCustomerOfferSentPushFields({ ...base });
    expect(f.title).toBe("New opening available");
    expect(f.title.toLowerCase()).not.toMatch(/\boffer\b/);
    expect(f.body.toLowerCase()).not.toMatch(/\boffer\b/);
  });

  it("includes service name in body when provided", () => {
    const f = buildCustomerOfferSentPushFields({
      ...base,
      serviceName: "Dental cleaning",
      startsAt: "2026-04-25T18:00:00.000Z",
    });
    expect(f.body).toContain("Dental cleaning");
    expect(f.body).toMatch(/is available/);
  });

  it("falls back to generic appointment label when service name missing", () => {
    const f = buildCustomerOfferSentPushFields({ ...base, startsAt: null });
    expect(f.body).toContain("An appointment");
    expect(f.body).toContain("soon");
  });

  it("includes routing ids and stable type, deep_link, dedupe_key", () => {
    const f = buildCustomerOfferSentPushFields({
      ...base,
      serviceName: "Consult",
      startsAt: "2026-06-01T14:00:00.000Z",
    });
    expect(f.type).toBe("offer_received");
    expect(f.deep_link).toBe(`/customer/offers/${base.offerId}`);
    expect(f.dedupe_key).toBe(`offer_received:${base.offerId}`);
    expect(f.business_id).toBe(base.businessId);
    expect(f.customer_id).toBe(base.customerId);
    expect(f.open_slot_id).toBe(base.openSlotId);
    expect(f.created_at).toBe(base.createdAt);
  });

  it("data map includes offer_id, open_slot_id, business_id, customer_id, type (all strings)", () => {
    const f = buildCustomerOfferSentPushFields({ ...base });
    expect(f.data).toEqual({
      type: "offer_received",
      business_id: base.businessId,
      customer_id: base.customerId,
      open_slot_id: base.openSlotId,
      offer_id: base.offerId,
    });
    for (const v of Object.values(f.data)) {
      expect(typeof v).toBe("string");
    }
    expect(JSON.stringify(f.data)).not.toContain("undefined");
  });

  it("does not add extra keys on top-level result beyond the contract", () => {
    const f = buildCustomerOfferSentPushFields({ ...base });
    const keys = Object.keys(f).sort();
    expect(keys).toEqual(
      ["body", "business_id", "created_at", "customer_id", "data", "dedupe_key", "deep_link", "open_slot_id", "title", "type"].sort(),
    );
  });
});
