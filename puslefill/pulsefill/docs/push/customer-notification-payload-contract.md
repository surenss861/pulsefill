# Customer push notification payload contract

Canonical routing for customer APNs notifications. **Source of truth** is the nested `data` object with **snake_case** keys. The iOS client (`NotificationRoutePayload`) prefers `userInfo["data"]` (including JSON string), then falls back to legacy top-level keys during migration.

## Root shape

```json
{
  "aps": {
    "alert": {
      "title": "…",
      "body": "…"
    }
  },
  "data": {
    "type": "<event_type>",
    "offer_id": "…",
    "claim_id": "…",
    "open_slot_id": "…"
  }
}
```

- **`data.type`**: always required for new payloads.
- **`offer_id` / `claim_id` / `open_slot_id`**: include when applicable (see table below).

**Legacy (migration only):** top-level `type`, `kind`, `offer_id`, `open_slot_id`, `claim_id` (and camelCase variants) may still be decoded on iOS; **new backend code must not rely on them**—emit nested `data` only.

## Event types (exact strings)

Use this vocabulary everywhere in new generators:

| `data.type` |
| --- |
| `offer_received` |
| `offer_expiring_soon` |
| `claim_submitted` |
| `claim_pending_confirmation` |
| `booking_confirmed` |
| `claim_unavailable` |
| `offer_expired` |
| `missed_opportunity` |
| `standby_status_reminder` |
| `standby_setup_suggestion` |

## Required routing fields

| Event | Required in `data` |
| --- | --- |
| `offer_received` | `offer_id` **or** `open_slot_id` |
| `offer_expiring_soon` | `offer_id` **or** `open_slot_id` |
| `claim_submitted` | `claim_id` |
| `claim_pending_confirmation` | `claim_id` |
| `booking_confirmed` | `claim_id` |
| `claim_unavailable` | `claim_id` |
| `offer_expired` | none; `offer_id` preferred |
| `missed_opportunity` | none; `offer_id` or `open_slot_id` preferred |
| `standby_status_reminder` | none |
| `standby_setup_suggestion` | none |

## Examples

### `offer_received`

```json
{
  "aps": {
    "alert": {
      "title": "New opening available",
      "body": "Yorkville Clinic has a matching opening for you."
    }
  },
  "data": {
    "type": "offer_received",
    "offer_id": "offer_123",
    "open_slot_id": "slot_123"
  }
}
```

### `offer_expiring_soon`

```json
{
  "aps": { "alert": { "title": "Offer expiring soon", "body": "This opening may not be available for long." } },
  "data": {
    "type": "offer_expiring_soon",
    "offer_id": "offer_123",
    "open_slot_id": "slot_123"
  }
}
```

### `claim_pending_confirmation`

```json
{
  "aps": { "alert": { "title": "Claim received", "body": "Your claim is in. The clinic still needs to confirm it." } },
  "data": {
    "type": "claim_pending_confirmation",
    "claim_id": "claim_123",
    "open_slot_id": "slot_123"
  }
}
```

### `booking_confirmed`

```json
{
  "aps": { "alert": { "title": "Booking confirmed", "body": "Yorkville Clinic confirmed your opening." } },
  "data": {
    "type": "booking_confirmed",
    "claim_id": "claim_123",
    "open_slot_id": "slot_123"
  }
}
```

### `claim_unavailable`

```json
{
  "aps": { "alert": { "title": "Opening no longer available", "body": "This opening is no longer available." } },
  "data": {
    "type": "claim_unavailable",
    "claim_id": "claim_123",
    "open_slot_id": "slot_123"
  }
}
```

### `missed_opportunity`

```json
{
  "aps": { "alert": { "title": "You missed an opening", "body": "A matching opening passed by. You can review what happened in the app." } },
  "data": {
    "type": "missed_opportunity",
    "offer_id": "offer_123",
    "open_slot_id": "slot_123"
  }
}
```

### `standby_status_reminder` / `standby_setup_suggestion`

```json
{
  "aps": { "alert": { "title": "Check your standby setup", "body": "Review your standby status and readiness." } },
  "data": { "type": "standby_status_reminder" }
}
```

## Backend helpers (`@pulsefill/shared`)

- **`buildCustomerPushPayload`**: low-level `aps` + `data` envelope; pass explicit `title` / `body` / ids.
- **`getCustomerPushCopy`**: default alert title/body per `CustomerPushEventType` (same strings as customer activity copy uses for push).
- **`buildCustomerPushFromCustomerEvent`**: combines copy + envelope (preferred when the event kind matches the taxonomy).

Re-exported from the API module `apps/api/src/modules/customers/customer-push-payload.ts` for convenience.

## Routing semantics (app)

- Offer-related types → Offers / slot flows.
- Claim and booking types → Activity / claim outcome.
- Missed opportunity and standby types → profile / settings style destinations (per `CustomerRouteMapper` / coordinator).
