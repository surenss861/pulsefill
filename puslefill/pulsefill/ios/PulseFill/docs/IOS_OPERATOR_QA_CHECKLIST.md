# PulseFill iOS Operator QA Checklist

## Auth
- [ ] Launch signed out routes to sign-in
- [ ] Sign in succeeds
- [ ] Sign out clears session
- [ ] Relaunch signed in restores operator tabs
- [ ] API 401 routes safely or shows recoverable auth state

## Overview
- [ ] Daily pulse loads
- [ ] Morning digest loads
- [ ] Queue metrics load
- [ ] Refresh works
- [ ] Refreshes after slot mutation

## Queue
- [ ] Needs action loads
- [ ] Review loads
- [ ] Resolved loads
- [ ] Loading skeleton appears
- [ ] Empty state is intentional
- [ ] Error state has retry
- [ ] Row tap opens detail
- [ ] Primary action works
- [ ] Primary action cannot double-submit
- [ ] Success feedback only appears after success

## Slots
- [ ] Slots load
- [ ] Filters/search remain usable
- [ ] Loading skeleton appears
- [ ] Empty state is intentional
- [ ] Error state has retry
- [ ] Row tap opens detail
- [ ] Primary action works when available
- [ ] Primary action cannot double-submit

## Slot Detail
- [ ] Identity header is correct
- [ ] Status/reason pills are correct
- [ ] Server-available actions render correctly
- [ ] Confirm booking succeeds
- [ ] Send offers succeeds
- [ ] Retry offers succeeds
- [ ] Expire slot succeeds
- [ ] Cancel slot succeeds
- [ ] Save note succeeds
- [ ] Success pulse only appears on success
- [ ] Errors do not show success pulse
- [ ] Detail refreshes after mutation
- [ ] Queue/Slots/Activity/Overview refresh after mutation
- [ ] Customer context handles missing data
- [ ] Delivery logs handle empty data
- [ ] Timeline handles empty data

## Activity
- [ ] Summary strip counts are correct
- [ ] Semantic sections render correctly
- [ ] Staff rows with openSlotId open detail
- [ ] Rows without openSlotId are informational
- [ ] Loading/error/empty states are polished

## Settings
- [ ] Account data loads
- [ ] Workspace data loads
- [ ] Missing optional fields do not look broken
- [ ] Workspace error shows retry
- [ ] Sign out works

## Mobile usability
- [ ] Queue rows scan quickly
- [ ] Slots rows are inventory-first
- [ ] Activity reads as record, not queue
- [ ] Buttons are thumb-friendly
- [ ] Destructive actions are not too easy to mis-tap
- [ ] No critical text is badly truncated
- [ ] Keyboard does not break note/settings forms
- [ ] Safe areas look correct
- [ ] Tab bar does not cover content

## Audit Session Notes (2026-04-25)

- Scope run this session: Queue -> Detail actions, Slots -> Detail actions, inline action hardening, success pulse gating.
- Simulator build verification: `xcodebuild ... -scheme PulseFill -destination 'platform=iOS Simulator,name=iPhone 17' build` passed after each hardening pass.
- Automated test suite status: `xcodebuild ... test` did not complete in this environment (runner hung after build/sign phase), so no checklist item was marked based on UI test execution.
- Manual simulator interaction status: not executed from this environment; checklist boxes remain unchecked until direct interactive verification is completed.
- Ready for manual audit handoff: mutation guards, notifier propagation, and success-pulse-only-on-success logic are implemented and compiled.
