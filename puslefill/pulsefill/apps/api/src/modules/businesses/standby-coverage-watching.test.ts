import assert from "node:assert/strict";
import test from "node:test";

import { eligibleWatchingCustomerCountForService, eligibleWatchingCustomerIdsForService } from "./standby-coverage.js";

const SERVICE_A = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const SERVICE_B = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const CUST_ELIGIBLE = "11111111-1111-4111-8111-111111111111";
const CUST_INELIGIBLE = "22222222-2222-4222-8222-222222222222";

test("wildcard service_id counts toward a service with zero direct watchers", () => {
  const prefs = [{ customer_id: CUST_ELIGIBLE, service_id: null as string | null }];
  const eligible = new Set([CUST_ELIGIBLE]);
  assert.equal(eligibleWatchingCustomerCountForService(prefs, eligible, SERVICE_A), 1);
});

test("service-specific preference counts only for that service", () => {
  const prefs = [{ customer_id: CUST_ELIGIBLE, service_id: SERVICE_A }];
  const eligible = new Set([CUST_ELIGIBLE]);
  assert.equal(eligibleWatchingCustomerCountForService(prefs, eligible, SERVICE_A), 1);
  assert.equal(eligibleWatchingCustomerCountForService(prefs, eligible, SERVICE_B), 0);
});

test("ineligible customer with wildcard does not count", () => {
  const prefs = [{ customer_id: CUST_INELIGIBLE, service_id: null }];
  const eligible = new Set([CUST_ELIGIBLE]);
  assert.equal(eligibleWatchingCustomerCountForService(prefs, eligible, SERVICE_A), 0);
});

test("same customer deduped when wildcard and specific pref both match a service", () => {
  const prefs = [
    { customer_id: CUST_ELIGIBLE, service_id: null },
    { customer_id: CUST_ELIGIBLE, service_id: SERVICE_A },
  ];
  const eligible = new Set([CUST_ELIGIBLE]);
  assert.equal(eligibleWatchingCustomerCountForService(prefs, eligible, SERVICE_A), 1);
});

test("eligibleWatchingCustomerIdsForService length matches count helper", () => {
  const prefs = [
    { customer_id: CUST_ELIGIBLE, service_id: null },
    { customer_id: CUST_ELIGIBLE, service_id: SERVICE_A },
  ];
  const eligible = new Set([CUST_ELIGIBLE]);
  const ids = eligibleWatchingCustomerIdsForService(prefs, eligible, SERVICE_A);
  assert.equal(ids.length, eligibleWatchingCustomerCountForService(prefs, eligible, SERVICE_A));
  assert.deepEqual(ids.sort(), [CUST_ELIGIBLE]);
});
