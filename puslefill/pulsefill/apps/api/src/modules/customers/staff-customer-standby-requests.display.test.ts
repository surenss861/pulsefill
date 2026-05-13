import assert from "node:assert/strict";
import test from "node:test";

import { staffFacingCustomerName } from "./staff-customer-standby-requests.routes.js";

test("staffFacingCustomerName formats first + last initial", () => {
  assert.equal(staffFacingCustomerName("Maya Rivera", "maya@example.com"), "Maya R.");
});

test("staffFacingCustomerName uses single word full name", () => {
  assert.equal(staffFacingCustomerName("Madonna", null), "Madonna");
});

test("staffFacingCustomerName falls back to email local-part", () => {
  assert.equal(staffFacingCustomerName(null, "maya@example.com"), "maya");
  assert.equal(staffFacingCustomerName("   ", "  sam@clinic.test  "), "sam");
});

test("staffFacingCustomerName returns null when empty", () => {
  assert.equal(staffFacingCustomerName(null, null), null);
});
