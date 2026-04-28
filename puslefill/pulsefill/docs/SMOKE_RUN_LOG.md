# Smoke run log (proof mode)

Use this after **one** full operator + iOS loop. Goal: find the **first failing seam**, fix only that, re-run.

Checklist and invite details: `ios/PulseFill/docs/CUSTOMER_FLOW_SMOKE_TEST.md`.

## 12-step loop (tick when done)

1. [ ] Operator signs in (dashboard)
2. [ ] Add location, provider, service
3. [ ] Create opening
4. [ ] Create customer invite
5. [ ] iOS customer signs in with **invited email**
6. [ ] Accept invite
7. [ ] Complete standby preferences
8. [ ] Operator sends offers (matching opening)
9. [ ] Customer sees offer (inbox)
10. [ ] Customer claims
11. [ ] Operator confirms booking
12. [ ] Command Center setup complete; Activity / outcomes reflect the run

If anything fails, **stop**. Fill **one** block below for the first failure only. Do not batch-fix.

---

## Run metadata (copy per attempt)

```text
Smoke Run Log
Date:
Commit:
Environment:
API:
Dashboard:
iOS build:

Step failed:
Expected:
Actual:
Evidence:
- DB row:
- API response:
- UI screen:
- Console/log:
First file/route/component to inspect:
```

---

## Likely seams (quick triage order)

1. Migrations `0018` / `0019` not applied  
2. Invite accepted but standby gate does not refresh  
3. `standby_preferences.business_id` mismatch  
4. Send offers returns no matches  
5. Offer exists but iOS inbox does not show it  
6. Claim succeeds but dashboard does not update  
7. Confirm succeeds but Command Center metric does not move  
