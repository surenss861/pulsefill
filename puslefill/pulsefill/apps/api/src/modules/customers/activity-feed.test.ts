import assert from "node:assert/strict";
import test from "node:test";

import {
  appendStandbySystemRows,
  claimStatusToEventKind,
  dedupeAndSort,
  offerRowStatusToFeedKind,
  type FeedItem,
} from "./activity-feed.js";
import { computeCustomerStandbyReadiness } from "./customer-standby-readiness.js";

const baseItem = (overrides: Partial<FeedItem>): FeedItem => ({
  id: "x",
  kind: "offer_received",
  title: "t",
  detail: null,
  occurred_at: "2026-04-16T12:00:00.000Z",
  state: null,
  offer_id: null,
  claim_id: null,
  open_slot_id: null,
  business_name: null,
  service_name: null,
  provider_name: null,
  location_name: null,
  starts_at: null,
  ends_at: null,
  ...overrides,
});

test("offerRowStatusToFeedKind maps terminal offer rows to offer_expired", () => {
  assert.equal(offerRowStatusToFeedKind("expired"), "offer_expired");
  assert.equal(offerRowStatusToFeedKind("failed"), "offer_expired");
  assert.equal(offerRowStatusToFeedKind("cancelled"), "offer_expired");
  assert.equal(offerRowStatusToFeedKind("sent"), "offer_received");
});

test("claimStatusToEventKind maps lost/failed to missed_opportunity", () => {
  assert.equal(claimStatusToEventKind("lost", "offered"), "missed_opportunity");
  assert.equal(claimStatusToEventKind("failed", "claimed"), "missed_opportunity");
});

test("claimStatusToEventKind maps confirmed+booked to booking_confirmed", () => {
  assert.equal(claimStatusToEventKind("confirmed", "booked"), "booking_confirmed");
});

test("claimStatusToEventKind maps won+claimed to claim_pending_confirmation", () => {
  assert.equal(claimStatusToEventKind("won", "claimed"), "claim_pending_confirmation");
});

test("claimStatusToEventKind defaults to claim_submitted", () => {
  assert.equal(claimStatusToEventKind("pending", "offered"), "claim_submitted");
});

test("dedupeAndSort drops duplicate composite keys", () => {
  const a = baseItem({
    id: "1",
    kind: "offer_received",
    offer_id: "o1",
    occurred_at: "2026-04-16T10:00:00.000Z",
  });
  const b = baseItem({
    id: "2",
    kind: "offer_received",
    offer_id: "o1",
    occurred_at: "2026-04-16T10:00:00.000Z",
  });
  const out = dedupeAndSort([a, b]);
  assert.equal(out.length, 1);
});

test("dedupeAndSort sorts by occurred_at descending (newest first)", () => {
  const older = baseItem({
    id: "old",
    occurred_at: "2026-04-15T12:00:00.000Z",
    offer_id: "a",
  });
  const newer = baseItem({
    id: "new",
    occurred_at: "2026-04-17T12:00:00.000Z",
    offer_id: "b",
  });
  const out = dedupeAndSort([older, newer]);
  assert.equal(out[0]?.occurred_at, "2026-04-17T12:00:00.000Z");
  assert.equal(out[1]?.occurred_at, "2026-04-15T12:00:00.000Z");
});

test("appendStandbySystemRows emits nothing when readiness flags false", () => {
  const readiness = computeCustomerStandbyReadiness({
    activePreferences: 1,
    pausedPreferences: 0,
    hasPushDevice: true,
    pushPermissionStatus: "authorized",
    pushEnabled: true,
    hasEmail: true,
    hasSms: false,
    hasAnyReachableChannel: true,
  });
  assert.equal(appendStandbySystemRows(readiness, "2026-04-16T12:00:00.000Z").length, 0);
});

test("appendStandbySystemRows emits setup suggestion when shouldSuggestSetup", () => {
  const readiness = computeCustomerStandbyReadiness({
    activePreferences: 0,
    pausedPreferences: 0,
    hasPushDevice: false,
    pushPermissionStatus: "unknown",
    pushEnabled: true,
    hasEmail: false,
    hasSms: false,
    hasAnyReachableChannel: false,
  });
  const rows = appendStandbySystemRows(readiness, "2026-04-16T12:00:00.000Z");
  assert.equal(rows.length, 1);
  assert.equal(rows[0]?.kind, "standby_setup_suggestion");
  assert.equal(rows[0]?.id, "system_standby_setup_suggestion");
  assert.equal(rows[0]?.occurred_at, "2026-04-16T12:00:00.000Z");
});

test("appendStandbySystemRows emits status reminder when shouldRemindStatus", () => {
  const readiness = computeCustomerStandbyReadiness({
    activePreferences: 1,
    pausedPreferences: 0,
    hasPushDevice: false,
    pushPermissionStatus: "authorized",
    pushEnabled: true,
    hasEmail: true,
    hasSms: false,
    hasAnyReachableChannel: true,
  });
  const rows = appendStandbySystemRows(readiness, "2026-04-16T12:00:00.000Z");
  assert.equal(rows.length, 1);
  assert.equal(rows[0]?.kind, "standby_status_reminder");
  assert.equal(rows[0]?.id, "system_standby_status_reminder");
});

test("appendStandbySystemRows emits setup only when push denied (not reminder)", () => {
  const readiness = computeCustomerStandbyReadiness({
    activePreferences: 2,
    pausedPreferences: 0,
    hasPushDevice: true,
    pushPermissionStatus: "denied",
    pushEnabled: true,
    hasEmail: true,
    hasSms: false,
    hasAnyReachableChannel: true,
  });
  const rows = appendStandbySystemRows(readiness, "2026-04-16T12:00:00.000Z");
  assert.equal(rows.length, 1);
  assert.equal(rows[0]?.kind, "standby_setup_suggestion");
});
