# PulseFill marketplace phases (product + engineering)

**Product statement:** PulseFill helps customers get earlier appointments and helps businesses recover cancelled booking revenue.

**Rule:** Customer accounts can be open; **business standby access is controlled** (`private` → `request_to_join` → `public`); discovery is **opt-in** per business.

## Shipped in repo (foundation)

- **`0020_marketplace_foundation.sql`:** `businesses.standby_access_mode`, `customer_discovery_enabled`, `customer_business_memberships`, `customer_standby_requests`.
- **Invite accept:** creates/updates **`customer_business_memberships`** (`source = invite`) so connections are explicit in the DB.
- **API**
  - `PATCH /v1/businesses/mine` — `standby_access_mode`, `customer_discovery_enabled`.
  - **Customer directory** (signed-in user, `requireAuth`):  
    `GET /v1/customers/directory/businesses`  
    `GET /v1/customers/directory/businesses/:businessId`  
    `POST /v1/customers/directory/businesses/:businessId/standby-intent` — `private` → 403; `request_to_join` → pending request; `public` → active membership.
  - **Staff:**  
    `GET /v1/businesses/mine/customer-standby-requests?status=pending`  
    `POST /v1/businesses/mine/customer-standby-requests/:id/review` — `{ "decision": "approve" | "decline" }`.
- **Dashboard:** Settings → **Standby access**; Customers → link to **Standby requests** page.
- **iOS:** Signed-out copy nudged toward self-serve + invite (full “Find businesses” UI still to wire).

## Not built yet (by design)

- **Phase 3:** In-app payments, deposits, platform fee %, Stripe Connect–style splits, public “browse all openings.”
- **Phase 4:** Tiered SaaS + take-rate billing automation, reviews, disputes, ranking, SEO business pages, customer reliability scores.

Ship the **core invite → standby → offer → claim → confirm** smoke loop before expanding marketplace scope.
