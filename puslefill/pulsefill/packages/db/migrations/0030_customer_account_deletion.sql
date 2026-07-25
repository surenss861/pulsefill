-- Self-serve account deletion (App Store Guideline 5.1.1(v) requires an
-- in-app path to delete an account, not just deactivate it). Soft-delete
-- rather than hard-delete: financial/audit records (slot_claims,
-- slot_claim_payments, audit_events) must survive for legitimate
-- record-keeping even after a customer scrubs their PII.

alter table public.customers
  add column deleted_at timestamptz;

create index customers_deleted_at_idx
  on public.customers (deleted_at)
  where deleted_at is not null;
