# Backend API contracts (PulseFill)

Authoritative **shapes and semantics** for clients (web, iOS) and backend contributors.  
Implementation lives under `apps/api/src/` unless noted.

---

## 1. Operator action errors (`sendActionError`)

Structured errors use a single envelope (see `apps/api/src/lib/action-response.ts` and `lib/action-replies.ts`):

```json
{
  "error": {
    "code": "<ActionErrorCode>",
    "message": "Human-readable message",
    "retryable": false,
    "details": {}
  }
}
```

- **`details`** is omitted when empty.
- **`retryable`**: `true` mainly for transient/server issues (e.g. `server_error`).

### `operator_action_not_allowed` (HTTP 409)

Returned when the server rejects a mutating operator action after reloading slot state (rules engine). Clients should **refetch slot detail** and reconcile lists.

**Confirm / expire / cancel** (single `attempted_action`):

| Field | Type | Meaning |
| --- | --- | --- |
| `attempted_action` | string | One of `OperatorSlotAvailableAction` (e.g. `confirm_booking`, `expire_slot`, `cancel_slot`) |
| `slot_status` | string | Normalized slot lifecycle (`open`, `offered`, `claimed`, …) |
| `queue_category` | string \| null | Derived queue category, or `null` |
| `available_actions` | string[] | Actions the server would offer for this state |

Source type: `OperatorActionRejectionDetails` in `modules/slots/assert-operator-action-allowed.ts`.

**Send / retry offers** (`POST /v1/open-slots/:id/send-offers`):

| Field | Type | Meaning |
| --- | --- | --- |
| `attempted_actions` | `["send_offers", "retry_offers"]` | Both are considered for this route |
| `slot_status`, `queue_category`, `available_actions` | (as above) | Same idea as single-action rejections |

### Other operator error codes (non-exhaustive)

| Code | Typical use |
| --- | --- |
| `slot_not_claimed` | Confirm when slot is not in a confirmable state |
| `slot_terminal_state` | Confirm when already booked/expired/cancelled (different from `operator_action_not_allowed`) |
| `claim_mismatch` | Claim id does not match slot |
| `not_found` | Slot or claim missing (often HTTP 404 with nested `error`, or legacy `{ "error": "not_found" }` on some routes) |
| `invalid_request` | Bad body/query |
| `forbidden` | Auth/business boundary |
| `server_error` | RPC/infra failure (`retryable` may be true) |

Success bodies for confirm and send-offers are typed as `ConfirmSuccessResponse` and `SendOffersSuccessResponse` in `lib/action-response.ts`.

---

## 2. Operator slot detail (`GET /v1/open-slots/:id`)

Handler: `modules/slots/open-slots.routes.ts`.

Response JSON:

```json
{
  "slot": { },
  "queue_context": { },
  "available_actions": [ ]
}
```

### `queue_context`

Derived from `operator-slot-rules` + enriched signals (`modules/slots/operator-slot-detail-context.ts`). Shape aligns with `OperatorSlotQueueContext` in `operator-slot-rules.ts`:

| Field | Type | Notes |
| --- | --- | --- |
| `current_category` | string \| null | e.g. `awaiting_confirmation`, `offered_active`, `delivery_failed`, … |
| `current_section` | string \| null | `needs_action`, `review`, `resolved` |
| `reason_title` | string \| null | Short headline for UI |
| `reason_detail` | string \| null | Longer explanation |
| `severity` | string \| null | `high` \| `medium` \| `low` |

### `available_actions`

Ordered list of `OperatorSlotAvailableAction` values the server considers valid for this slot **right now** (e.g. `confirm_booking`, `send_offers`, `retry_offers`, `expire_slot`, `cancel_slot`, `add_note`, `inspect_notification_logs`).  
**Clients must not** invent actions outside this list.

### `slot`

Open slot row plus `winning_claim` and `last_touched_by` as built by the route (embedded relations stripped/renamed as implemented).

---

## 3. Bulk operator actions (`POST /v1/open-slots/bulk-action`)

See `modules/slots/bulk-actions.ts`.

- **HTTP 200** with `ok: true` even when some rows fail (per-row outcomes).
- Per item: `status`: `processed` \| `skipped` \| `failed`.
- Rule violation: `status: "failed"`, `code: "operator_action_not_allowed"` (flat string on the item).
- Wrong business / missing row: often `status: "skipped"`, `code: "not_found"`.

---

## 4. Customer activity feed event kinds

Canonical enum: `CustomerEventKind` in `modules/customers/customer-event-taxonomy.ts`:

| Kind | Used in activity feed (typical) |
| --- | --- |
| `offer_received` | Active offer row |
| `offer_expired` | Expired/failed/cancelled offer row |
| `offer_expiring_soon` | Taxonomy / push; not necessarily every feed row |
| `claim_submitted` | Default claim mapping |
| `claim_pending_confirmation` | Won claim, slot still `claimed` |
| `booking_confirmed` | Confirmed claim + booked slot |
| `missed_opportunity` | Lost/failed claim |
| `claim_unavailable` | Taxonomy; reserved |
| `standby_setup_suggestion` | System row: readiness says user should complete setup |
| `standby_status_reminder` | System row: prefs exist but push device missing (simplified) |

**Mapping helpers (tests + implementation):** `offerRowStatusToFeedKind`, `claimStatusToEventKind` in `modules/customers/activity-feed.ts`.

**Feed mechanics:**

- Items are merged from offers, claims, and **system rows**, then **`dedupeAndSort`** (dedupe key: `kind|offer_id|claim_id|open_slot_id|occurred_at`, sort: newest `occurred_at` first).
- `GET /v1/customers/me/activity-feed` accepts **`pushPermissionStatus`** (query) so readiness matches client-reported permission state.

---

## 5. Standby readiness & system rows

Shared logic: `modules/customers/customer-standby-readiness.ts` (`buildStandbyReadinessInputFromLoaded`, `computeCustomerStandbyReadiness`, `latestStandbyTouchIso`, `fetchCustomerStandbyPrereqs`).

**`shouldSuggestSetup`** is true when any of:

- No active standby preferences, or  
- No reachable channel (email/SMS/push path per rules), or  
- Push permission is **`denied`**

**`shouldRemindStatus`** is true when:

- At least one active preference, push is not denied, push is enabled in profile, **no registered push device**, and some channel is still reachable (so user can fix device registration).

**System row ids** (stable for dedupe/UI):

- `system_standby_setup_suggestion`
- `system_standby_status_reminder`

**`latestStandbyTouchIso`**: max of notification-pref `updated_at`, customer `created_at`, and each preference `updated_at`; if none, current time ISO string.

---

## 6. Push payloads (customer)

See **`docs/push/customer-notification-payload-contract.md`** — nested `data`, snake_case, `data.type` vocabulary aligned with `CustomerEventKind` where applicable.

---

## 7. Related QA docs

- Operator manual QA: `docs/operator-qa-bug-bash-checklist.md`

---

*When changing rules or response shapes, update this file and the referenced source modules together.*
