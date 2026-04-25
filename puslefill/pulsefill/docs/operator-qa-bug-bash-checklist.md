# Operator QA / bug bash checklist (Web + iOS)

Manual regression matrix for the **operator console**: server-driven slot detail, guarded mutations, canonical routing, and refresh trust.

**Architecture under test**

- **Server:** `queue_context`, `available_actions`, guarded operator routes (`operator_action_not_allowed` / 409).
- **Web canonical detail:** `apps/dashboard-web/app/(protected)/open-slots/[id]/page.tsx` — refresh bus: `lib/operator-refresh-events.ts`, `hooks/useOperatorRefreshSubscription.ts`.
- **iOS canonical detail:** `OperatorSlotDetailView` / `OperatorSlotDetailViewModel` — refresh bus: `OperatorMutationNotifier` + `OperatorRefreshNotifications` (NotificationCenter).

Use this doc for a focused pass: **trust and correctness**, not new features.

---

## Severity guide

| Tier | Examples |
|------|-----------|
| **P0** | Wrong slot opens; invalid action mutates; success but lists/queue/detail don’t reconcile; 409 doesn’t reload truth; queue category contradicts backend; bulk mutates invalid rows without guard |
| **P1** | Stale row until manual refresh; overview lags; note/timeline not visible after save; action ordering vs server matrix; row tap vs inline action conflict |
| **P2** | Styling; banner severity nuance; utility scroll targets; copy polish |

---

## A. Action queue (web: Action Queue page; iOS: Queue tab)

### A1. Queue category & section

For each backend category, confirm row **headline/section** matches API truth:

- `awaiting_confirmation`, `delivery_failed`, `retry_recommended`, `no_matches`, `offered_active`, `expired_unfilled`, `confirmed_booking` (and any “resolved” presentation).

**Expect:** Row appears in exactly one of needs_action / review / resolved; no duplicate; resolved does not linger in Needs action.

### A2. Queue row interactions

- [ ] Row / body tap → **canonical** slot detail (`/open-slots/:id` web; `OperatorSlotDetailView` iOS).
- [ ] Inline primary action **does not** navigate; only mutates or opens detail per product rule.
- [ ] `view_slot` / `open_slot` / `inspect_logs` — navigation or scroll, **not** fake lifecycle mutation.
- [ ] Web: `available_actions` / row contract from API; iOS: `OperatorPrimaryActionDeriver` treats `open_slot` like non-inline (navigation).

### A3. Queue refresh trust

After mutation from **queue inline**, **slot detail**, or **claims confirm**:

- [ ] Queue list reconciles (web: `slot:updated` → silent reload; iOS: `slotUpdated` → `load(silent:)`).
- [ ] Web: Daily ops / breakdown / delivery on overview path refresh as subscribed.
- [ ] iOS: Queue tab **Daily ops / insights / delivery** refresh via same `OperatorActionQueueViewModel.load(silent:)` (piggyback on queue reload).
- [ ] No obvious double-loading UX regression (iOS removed redundant post-inline `load` where notifier drives refresh).

---

## B. Open slots list

- [ ] Row / header tap → canonical slot detail (same route/screen as explicit Open).
- [ ] Inline primary action does **not** trigger row navigation.
- [ ] Status chip matches backend after mutations from detail or inline.
- [ ] Web: `slot:updated` → list silent reload; bulk processed slots emit per-slot updates (`emitOperatorRefreshAfterBulkSlotAction`).
- [ ] iOS: `slotUpdated` subscription → `load()`.

---

## C. Claims

- [ ] Body tap → canonical slot detail; explicit Open / view affordance → same destination.
- [ ] Back stack returns to Claims.
- [ ] Confirm success: list updates (web: emit + subscription; iOS: `postSlotUpdated` + VM subscription, no duplicate redundant load where removed).
- [ ] Booking confirmed reflected in queue / activity where applicable.

---

## D. Canonical slot detail

### D1. Header & chips

- [ ] Provider, time range, value, lifecycle status match list/API.
- [ ] Web: queue/category presentation from `queue_context`; iOS: banner when `reason_title` present; severity `high` / `medium` / `low` styling.

### D2. Reason banner

- [ ] Shown only when there is meaningful `reason_title` (web + iOS).
- [ ] After mutation + refetch, banner copy matches new server state (not stale client guess).

### D3. Action bar (`available_actions` only)

- [ ] Only server-listed actions appear; utilities (`add_note`, `inspect_notification_logs`) behave as utilities (scroll / inspect), not illegal POSTs.
- [ ] Illegal combinations never shown (server is source of truth).
- [ ] Web: `ConfirmBookingButton` / `RetryOffersButton` / expire / cancel + conflict toast + `refreshAll` on 409.
- [ ] iOS: `handleMutationError` — 409 + `operator_action_not_allowed` → copy + `load()`; no notifier spam on conflict-only path (detail refetch only).

---

## E. Mutation matrix (run each as explicit scenario)

| # | Action | Preconditions (summary) | Expect after success |
|---|--------|---------------------------|------------------------|
| E1 | Confirm booking | Claimed + awaiting confirmation | Detail + queue + claims + lists + activity/overview subscribers refresh; queue row leaves needs action |
| E2 | Retry offers | Server allows retry | Same refresh surfaces; offered / delivery semantics match API |
| E3 | Send offers | Open slot, allowed | Slot moves toward offered; lists/queue/overview honest |
| E4 | Expire | Allowed terminal transition | Lists/queue/overview/digest honest where wired |
| E5 | Cancel | Policy allows | Same |
| E6 | Add note | Always allowed path | Detail note + timeline; **web:** `slot:note_updated` → Activity, not thrashing queue/slots unnecessarily; **iOS:** `slotNoteUpdated` → Activity VM reload |

**Negative / 409:** confirm when already booked; expire/cancel wrong state; retry when disallowed — **Expect:** structured rejection, detail reload, **no** web `slot:updated` / iOS `slotUpdated` for conflict-only recovery if implementation is “success-only emit”.

---

## F. Bulk actions (web)

- [ ] Mixed selection: some processed / skipped / failed — result modal; sample rows link to `/open-slots/:id`.
- [ ] `emitOperatorRefreshAfterBulkSlotAction` only for `processed` rows.
- [ ] No auto-navigation into random single detail after bulk (by design).
- [ ] Activity-linked bulk + filtered open-slots URL still behave.

---

## G. Activity

### Web (`activity` page)

- [ ] `slot:updated` / `slot:note_updated` → silent reload when mounted.
- [ ] Card with `open_slot_id` + `open_detail` in `available_actions` (when API sends it) — body link behavior per `operator-activity-card.tsx`.
- [ ] No fake “open detail” without slot id.

### iOS (Activity tab — `CustomerActivityFeedViewModel`)

- [ ] Subscribes to `slotUpdated` + `slotNoteUpdated`; feed updates without relying only on pull-to-refresh.
- [ ] No crash / jank from subscription path.

---

## H. Overview / daily ops / digest (web)

- [ ] `useOperatorRefreshSubscription` on overview → `slot:updated` triggers full `refresh()` (metrics, setup, queue preview, daily ops, breakdown, delivery).
- [ ] After confirm / expire / cancel / send / retry — counts don’t lie until manual refresh.

**iOS:** No separate Overview tab; queue tab strips refresh with queue `load(silent:)` — confirm after slot mutations.

---

## I. Routing & back navigation

| From | To detail | Back returns to |
|------|-----------|-----------------|
| Web: Action Queue | `/open-slots/[id]` | Queue |
| Web: Open Slots | same | Open Slots |
| Web: Activity | same | Activity |
| Web: Claims | same | Claims |
| iOS: Queue / Slots / Claims | `OperatorSlotDetailView` | Same tab root |

**Expect:** Single canonical detail; no competing operator “detail” screens.

---

## J. Execution order (suggested)

1. Web: slot-detail mutation matrix (E + D + F conflict).
2. Web: routing / back-nav (I).
3. Web: bulk mixed-result (F).
4. iOS: queue → slots → claims → detail (I + D).
5. iOS: mutation refresh trust (A3, B, C, G).
6. Cross-check overview / daily ops (H).

---

## K. References (implementation anchors)

| Area | Web | iOS |
|------|-----|-----|
| Refresh emit | `lib/operator-refresh-events.ts`, `emitOperatorRefreshAfterBulkSlotAction` | `OperatorMutationNotifier.swift` |
| Refresh subscribe | `useOperatorRefreshSubscription.ts` | `operatorRefreshTokens` in queue / slots / claims VMs + `CustomerActivityFeedViewModel` |
| Detail UI | `open-slots/[id]/page.tsx`, `operator-slot-action-bar.tsx` | `OperatorSlotDetailView.swift`, `OperatorSlotDetailViewModel.swift` |
| Routes | `lib/open-slot-routes.ts` | `NavigationStack` + `String` slot id |

Log failures with **P0/P1/P2**, platform, and **steps + expected vs actual**. Fix trust breakers first.
