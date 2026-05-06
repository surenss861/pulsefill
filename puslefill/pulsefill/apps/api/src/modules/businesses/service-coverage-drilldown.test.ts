import assert from "node:assert/strict";
import test from "node:test";

import { computeServiceCoverageSuggestedAction } from "./service-coverage-drilldown.js";

test("computeServiceCoverageSuggestedAction invites when no watchers", () => {
  const a = computeServiceCoverageSuggestedAction({
    watching: 0,
    reachable: 0,
    topReason: undefined,
  });
  assert.equal(a.key, "invite_watchers");
  assert.equal(a.href, "/customers#invite-customer");
});

test("computeServiceCoverageSuggestedAction grow_pool links to invite when only one watcher", () => {
  const a = computeServiceCoverageSuggestedAction({
    watching: 1,
    reachable: 1,
    topReason: undefined,
  });
  assert.equal(a.key, "grow_pool");
  assert.equal(a.href, "/customers#invite-customer");
});

test("computeServiceCoverageSuggestedAction prefers reachability when watchers exist but none reachable", () => {
  const a = computeServiceCoverageSuggestedAction({
    watching: 2,
    reachable: 0,
    topReason: { reason: "notice_window_mismatch", count: 3 },
  });
  assert.equal(a.key, "reachability");
});

test("computeServiceCoverageSuggestedAction uses top reason when reachability ok", () => {
  const a = computeServiceCoverageSuggestedAction({
    watching: 3,
    reachable: 3,
    topReason: { reason: "notice_window_mismatch", count: 2 },
  });
  assert.equal(a.key, "notice");
  assert.equal(a.href, "/open-slots");
});
