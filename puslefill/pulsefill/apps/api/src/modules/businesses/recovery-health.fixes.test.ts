import assert from "node:assert/strict";
import test from "node:test";

import { computeRecoveryReadinessFixes } from "./recovery-health.js";

test("computeRecoveryReadinessFixes orders locations before providers before services", () => {
  const fixes = computeRecoveryReadinessFixes({
    setupComplete: false,
    locCount: 0,
    provCount: 0,
    svcCount: 0,
    standbyCount: 0,
    reachableCount: 0,
    reachRatio: 0,
  });
  assert.deepEqual(
    fixes.map((f) => f.key),
    ["locations", "providers", "services"],
  );
});

test("computeRecoveryReadinessFixes adds standby when setup complete and pool thin", () => {
  const fixes = computeRecoveryReadinessFixes({
    setupComplete: true,
    locCount: 1,
    provCount: 1,
    svcCount: 1,
    standbyCount: 1,
    reachableCount: 1,
    reachRatio: 1,
  });
  assert.ok(fixes.some((f) => f.key === "standby_pool"));
  assert.ok(!fixes.some((f) => f.key === "notification_reach"));
});

test("computeRecoveryReadinessFixes adds notification reach when ratio weak", () => {
  const fixes = computeRecoveryReadinessFixes({
    setupComplete: true,
    locCount: 1,
    provCount: 1,
    svcCount: 1,
    standbyCount: 4,
    reachableCount: 1,
    reachRatio: 0.25,
  });
  assert.ok(fixes.some((f) => f.key === "notification_reach"));
});
