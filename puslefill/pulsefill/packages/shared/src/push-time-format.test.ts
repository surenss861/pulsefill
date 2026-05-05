import { describe, expect, it } from "vitest";

import { formatPushSlotTime } from "./push-time-format.js";

describe("formatPushSlotTime", () => {
  it('returns "soon" for invalid ISO', () => {
    expect(formatPushSlotTime("not-a-date")).toBe("soon");
    expect(formatPushSlotTime("")).toBe("soon");
  });

  it("formats a valid instant in America/Toronto (stable zone for product copy)", () => {
    // Noon UTC on a summer day → 8:00 AM Eastern (EDT)
    const s = formatPushSlotTime("2026-07-15T12:00:00.000Z");
    expect(s).toMatch(/Jul/);
    expect(s).toMatch(/15/);
    expect(s).toMatch(/8/);
    expect(s.toLowerCase()).toMatch(/a\.m\.|p\.m\./);
  });

  it("matches documented API behavior for the same input as push-payloads tests", () => {
    expect(formatPushSlotTime("invalid")).toBe("soon");
    const s = formatPushSlotTime("2026-04-25T18:00:00.000Z");
    expect(s).not.toBe("soon");
    expect(s.length).toBeGreaterThan(4);
  });
});
