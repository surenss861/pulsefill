import assert from "node:assert/strict";
import test from "node:test";

import {
  buildStandbyReadinessInputFromLoaded,
  computeCustomerStandbyReadiness,
  latestStandbyTouchIso,
  type StandbyPreferenceRow,
} from "./customer-standby-readiness.js";

function pref(partial: Partial<StandbyPreferenceRow> & Pick<StandbyPreferenceRow, "id" | "business_id">): StandbyPreferenceRow {
  return {
    max_notice_hours: null,
    active: true,
    updated_at: "2026-04-10T10:00:00.000Z",
    businesses: null,
    services: null,
    locations: null,
    providers: null,
    ...partial,
  };
}

test("buildStandbyReadinessInputFromLoaded treats push denied as unreachable for push", () => {
  const input = buildStandbyReadinessInputFromLoaded({
    customer: {
      email: "a@b.co",
      phone: null,
      push_enabled: true,
      sms_enabled: false,
      email_enabled: true,
    },
    prefRows: [pref({ id: "p1", business_id: "b1", active: true, updated_at: "2026-04-01T00:00:00.000Z" })],
    pushDeviceCount: 1,
    pushPermissionStatus: "denied",
  });
  assert.equal(input.pushPermissionStatus, "denied");
  const r = computeCustomerStandbyReadiness(input);
  assert.equal(r.shouldSuggestSetup, true);
});

test("buildStandbyReadinessInputFromLoaded shouldRemindStatus when prefs exist but no device", () => {
  const input = buildStandbyReadinessInputFromLoaded({
    customer: {
      email: "a@b.co",
      phone: null,
      push_enabled: true,
      sms_enabled: false,
      email_enabled: true,
    },
    prefRows: [pref({ id: "p1", business_id: "b1", active: true })],
    pushDeviceCount: 0,
    pushPermissionStatus: "authorized",
  });
  const r = computeCustomerStandbyReadiness(input);
  assert.equal(r.shouldRemindStatus, true);
  assert.equal(r.shouldSuggestSetup, false);
});

test("latestStandbyTouchIso picks latest timestamp across prefs and customer", () => {
  const iso = latestStandbyTouchIso({
    prefRows: [
      pref({
        id: "p1",
        business_id: "b1",
        updated_at: "2026-04-01T00:00:00.000Z",
      }),
      pref({
        id: "p2",
        business_id: "b2",
        updated_at: "2026-04-20T00:00:00.000Z",
      }),
    ],
    notificationPrefsUpdatedAt: "2026-04-15T00:00:00.000Z",
    customerCreatedAt: "2026-01-01T00:00:00.000Z",
  });
  assert.equal(iso, "2026-04-20T00:00:00.000Z");
});

test("latestStandbyTouchIso falls back to now-ish when no candidates (uses Date)", () => {
  const iso = latestStandbyTouchIso({
    prefRows: [],
    notificationPrefsUpdatedAt: null,
    customerCreatedAt: null,
  });
  assert.ok(Date.parse(iso) > 0);
});
