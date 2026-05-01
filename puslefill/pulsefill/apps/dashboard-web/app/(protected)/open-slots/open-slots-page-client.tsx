"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { OperatorFilterBar } from "@/components/operator/operator-filter-bar";
import { OperatorSavedViews } from "@/components/operator/operator-saved-views";
import { OperatorBulkActionBar } from "@/components/slots/operator-bulk-action-bar";
import { OperatorBulkActionConfirmModal } from "@/components/slots/operator-bulk-action-confirm-modal";
import { OperatorBulkActionResult } from "@/components/slots/operator-bulk-action-result";
import { OperatorSlotListRow } from "@/components/slots/operator-slot-list-row";
import { OperatorSlotListSummary } from "@/components/slots/operator-slot-list-summary";
import { OperatorSlotListToolbar } from "@/components/slots/operator-slot-list-toolbar";
import { SendOffersPrereqCallout } from "@/components/slots/send-offers-prereq-callout";
import { useToast } from "@/components/ui/toast-provider";
import { useBulkSelection } from "@/hooks/useBulkSelection";
import { useOperatorFilterOptions } from "@/hooks/useOperatorFilterOptions";
import { useOperatorFilters } from "@/hooks/useOperatorFilters";
import { useOperatorRowAction } from "@/hooks/useOperatorRowAction";
import { useOperatorRefreshSubscription } from "@/hooks/useOperatorRefreshSubscription";
import { useOperatorSlotsList } from "@/hooks/useOperatorSlotsList";
import { runOperatorBulkAction } from "@/lib/operator-bulk-actions";
import { emitOperatorRefreshAfterBulkSlotAction } from "@/lib/operator-refresh-events";
import { OperatorEmptyState } from "@/components/operator/operator-empty-state";
import { OperatorErrorState } from "@/components/operator/operator-error-state";
import { OperatorLoadingState } from "@/components/operator/operator-loading-state";
import { RecoveryPipeline } from "@/components/operator/recovery-pipeline";
import { OperatorPageTransition } from "@/components/operator/operator-page-transition";
import { MotionAction } from "@/components/operator/operator-motion-primitives";
import { actionLinkStyle } from "@/lib/operator-action-link-styles";
import { matchesOperatorFilters } from "@/lib/operator-filters";
import type { DerivedOperatorPrimaryAction } from "@/lib/operator-primary-action";
import { digestSectionBannerTitle } from "@/lib/morning-recovery-digest-ui";
import { OPERATOR_SLOT_FILTERS, getOperatorSlotEmptyCopy } from "@/lib/operator-slots-ui";
import { slotsDetailPath, slotsDetailParamsFromListContext } from "@/lib/open-slot-routes";
import type { BulkSlotActionKind, BulkSlotActionResponse } from "@/types/bulk-actions";
import type { OperatorSlotsFilter, OperatorSlotsListItem } from "@/types/operator-slots-list";

function parseSlotsStatusParam(value: string | null): OperatorSlotsFilter {
  if (!value) return "all";
  const hit = OPERATOR_SLOT_FILTERS.find((x) => x.key === value);
  return hit ? (hit.key as OperatorSlotsFilter) : "all";
}

export default function OpenSlotsPageClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const digestKind = searchParams.get("digest");
  const digestSlotIdsParam = searchParams.get("digest_slot_ids");

  const digestSlotSet = useMemo(() => {
    if (!digestSlotIdsParam?.trim()) return null;
    const ids = digestSlotIdsParam
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    return ids.length > 0 ? new Set(ids) : null;
  }, [digestSlotIdsParam]);

  const [filter, setFilter] = useState<OperatorSlotsFilter>(() => parseSlotsStatusParam(searchParams.get("status")));
  const { slots, filteredSlots, counts, loading, error, reload, reloading } = useOperatorSlotsList(filter);
  const filterState = useOperatorFilters({
    filtersStorageKey: "pf.operator.open-slots.filters",
    viewsStorageKey: "pf.operator.open-slots.views",
  });
  const filterOptions = useOperatorFilterOptions();
  const { selectedIds, isSelected, toggle, toggleAll, clear: clearBulkSelection } = useBulkSelection();
  const { showToast } = useToast();
  const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false);
  const [bulkPendingAction, setBulkPendingAction] = useState<BulkSlotActionKind | null>(null);
  const [bulkResult, setBulkResult] = useState<BulkSlotActionResponse | null>(null);
  const [bulkRunning, setBulkRunning] = useState(false);

  const visibleSlots = useMemo(() => {
    return filteredSlots.filter((slot) =>
      matchesOperatorFilters(
        {
          provider_id: slot.provider_id ?? null,
          location_id: slot.location_id ?? null,
          service_id: slot.service_id ?? null,
        },
        filterState.filters,
      ),
    );
  }, [filteredSlots, filterState.filters]);

  const digestFilteredSlots = useMemo(() => {
    if (!digestSlotSet) return visibleSlots;
    return visibleSlots.filter((s) => digestSlotSet.has(s.id));
  }, [visibleSlots, digestSlotSet]);

  const slotsForList = digestSlotSet ? digestFilteredSlots : visibleSlots;

  const visibleIds = useMemo(() => slotsForList.map((s) => s.id), [slotsForList]);

  const filterFingerprint = useMemo(
    () => JSON.stringify({ tab: filter, filters: filterState.filters }),
    [filter, filterState.filters],
  );

  useEffect(() => {
    clearBulkSelection();
  }, [filterFingerprint, clearBulkSelection]);

  const rowAction = useOperatorRowAction(() => reload({ silent: true }));

  const refreshFromOperatorEvent = useCallback(() => {
    void reload({ silent: true });
  }, [reload]);

  useOperatorRefreshSubscription({
    onSlotUpdated: refreshFromOperatorEvent,
  });

  useEffect(() => {
    setFilter(parseSlotsStatusParam(searchParams.get("status")));
  }, [searchParams]);

  const commitListFilter = useCallback(
    (next: OperatorSlotsFilter) => {
      setFilter(next);
      const nextSearch = new URLSearchParams(searchParams.toString());
      if (next === "all") nextSearch.delete("status");
      else nextSearch.set("status", next);
      const qs = nextSearch.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [router, pathname, searchParams],
  );

  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => isSelected(id));

  const digestBanner =
    digestKind && digestSlotSet
      ? {
          title: digestSectionBannerTitle(digestKind),
          subtitle:
            digestFilteredSlots.length === 0
              ? "None of these openings match your current tab/filters. Try “All” or clear filters."
              : `Showing ${digestFilteredSlots.length} of ${digestSlotSet.size} digest opening${
                  digestSlotSet.size === 1 ? "" : "s"
                } that match this view.`,
        }
      : digestKind
        ? {
            title: digestSectionBannerTitle(digestKind),
            subtitle: "Review the list below, or adjust filters to match digest openings.",
          }
        : null;

  async function confirmBulk() {
    if (!bulkPendingAction || selectedIds.length === 0) return;
    const ids = [...selectedIds];
    setBulkConfirmOpen(false);
    setBulkRunning(true);
    try {
      const res = await runOperatorBulkAction({ action: bulkPendingAction, openSlotIds: ids });
      setBulkResult(res);
      clearBulkSelection();
      emitOperatorRefreshAfterBulkSlotAction(res);
      await reload({ silent: true });
    } catch (err) {
      showToast({
        title: err instanceof Error ? err.message : "Bulk action failed",
        tone: "error",
      });
    } finally {
      setBulkRunning(false);
      setBulkPendingAction(null);
    }
  }

  async function handlePrimaryAction(slot: OperatorSlotsListItem, action: DerivedOperatorPrimaryAction) {
    if (!action) return;

    const successTitle =
      action.kind === "confirm_booking"
        ? "Booking confirmed"
        : action.kind === "send_offers"
          ? "Offers sent"
          : "Offers retried";

    await rowAction.run({
      rowId: slot.id,
      kind: action.kind,
      openSlotId: slot.id,
      claimId: action.kind === "confirm_booking" ? action.claimId : null,
      successTitle,
    });
  }

  return (
    <main className="pf-page-openings" style={{ padding: "0 0 24px", paddingBottom: selectedIds.length > 0 ? 120 : 24 }}>
      <OperatorPageTransition>
      <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
        <button
          type="button"
          onClick={() => void reload()}
          disabled={reloading}
          style={{
            background: "transparent",
            border: "1px solid rgba(255,255,255,0.2)",
            color: "var(--text)",
            borderRadius: 12,
            padding: "8px 14px",
            cursor: reloading ? "wait" : "pointer",
          }}
        >
          {reloading ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {digestBanner ? (
        <div
          style={{
            marginTop: 16,
            padding: 14,
            borderRadius: 14,
            border: "1px solid var(--pf-accent-primary-border)",
            background: "rgba(255, 122, 24, 0.08)",
          }}
        >
          <div style={{ fontSize: 12, color: "var(--pf-chip-primary-text)", letterSpacing: "0.04em", textTransform: "uppercase" }}>
            Morning Recovery Digest
          </div>
          <div style={{ fontSize: 16, fontWeight: 650, marginTop: 4 }}>{digestBanner.title}</div>
          <p style={{ margin: "8px 0 0 0", fontSize: 13, color: "var(--muted)", lineHeight: 1.5 }}>{digestBanner.subtitle}</p>
          <Link
            href="/open-slots"
            style={{ display: "inline-block", marginTop: 10, fontSize: 13, color: "var(--primary)", fontWeight: 600 }}
          >
            Clear digest view
          </Link>
        </div>
      ) : null}

      {loading ? (
        <div style={{ marginTop: 8 }}>
          <OperatorLoadingState variant="section" skeleton="rows" title="Loading openings…" />
        </div>
      ) : null}
      {error ? (
        <div style={{ marginTop: 12 }}>
          <OperatorErrorState rawMessage={error} />
        </div>
      ) : null}

      {!loading && !error && slots.length === 0 ? (
        <div style={{ marginTop: 20 }}>
          <OperatorEmptyState
            boardSplit
            title="No openings yet"
            description="Create an appointment opening when a cancellation appears. PulseFill will help match it to standby customers."
            visual={
              <div
                aria-hidden
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  border: "1px solid rgba(255, 122, 24, 0.28)",
                  background:
                    "radial-gradient(circle at 32% 28%, rgba(255, 200, 150, 0.35), rgba(255, 122, 24, 0.1) 45%, rgba(8, 7, 6, 0.85))",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08), 0 8px 24px rgba(0,0,0,0.35)",
                }}
              />
            }
            primaryAction={
              <MotionAction>
                <Link href="/open-slots/create" style={actionLinkStyle("primary")}>
                  Create opening
                </Link>
              </MotionAction>
            }
            secondaryContent={
              <>
                <div className="pf-openings-empty-pipeline-wrap">
                  <RecoveryPipeline
                    activeStep="opening"
                    compact
                    animated
                    interactive
                    style={{
                      background: "transparent",
                      boxShadow: "none",
                      border: "1px solid rgba(255,255,255,0.055)",
                    }}
                  />
                </div>
                <p className="pf-kicker" style={{ margin: "16px 0 8px", fontSize: 9 }}>
                  What happens next
                </p>
                <ol className="pf-openings-next-stack">
                  <li>Capture cancelled time</li>
                  <li>Match standby customers</li>
                  <li>Send offers</li>
                  <li>Confirm claimed booking</li>
                </ol>
                <MotionAction>
                  <Link href="/customers" style={{ ...actionLinkStyle("ghost"), display: "inline-block", marginTop: 14, fontSize: 13 }}>
                    Invite standby customers
                  </Link>
                </MotionAction>
                <details className="pf-overview-edu" style={{ marginTop: 16 }}>
                  <summary>Show how recovery works</summary>
                  <p className="pf-overview-edu__body">
                    Staff posts a cancelled time as an opening, PulseFill matches standby preferences, you send offers, a customer claims, and
                    you confirm once the appointment exists on the calendar.
                  </p>
                </details>
              </>
            }
          />
        </div>
      ) : null}

      {!loading && !error && slots.length > 0 ? (
        <div style={{ marginTop: 20, display: "grid", gap: 18 }}>
          <SendOffersPrereqCallout />
          <OperatorSlotListSummary counts={counts} />
          <OperatorSlotListToolbar selectedFilter={filter} onChange={commitListFilter} counts={counts} />

          {filterOptions.error ? (
            <p style={{ color: "#f87171", fontSize: 13 }}>Filters: {filterOptions.error}</p>
          ) : null}
          {!filterOptions.loading ? (
            <>
              <OperatorFilterBar
                filters={filterState.filters}
                onChange={filterState.setFilters}
                providers={filterOptions.providers}
                locations={filterOptions.locations}
                services={filterOptions.services}
              />
              <OperatorSavedViews
                views={filterState.views}
                onApply={filterState.setFilters}
                onCreate={filterState.createView}
                onDelete={filterState.deleteView}
              />
            </>
          ) : (
            <p style={{ color: "var(--muted)", fontSize: 13 }}>Loading filter options…</p>
          )}

          {slotsForList.length === 0 ? (
            <div
              style={{
                padding: 18,
                borderRadius: 18,
                border: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(255,255,255,0.03)",
                fontSize: 14,
                opacity: 0.75,
              }}
            >
              {digestSlotSet && digestFilteredSlots.length === 0
                ? "No digest openings in this filtered view."
                : getOperatorSlotEmptyCopy(filter)}
            </div>
          ) : (
            <>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  fontSize: 14,
                  cursor: "pointer",
                  userSelect: "none",
                }}
              >
                <input
                  type="checkbox"
                  checked={allVisibleSelected}
                  onChange={() => toggleAll(visibleIds)}
                  style={{ width: 18, height: 18 }}
                />
                <span>
                  Select all visible ({visibleIds.length}
                  {digestSlotSet ? ` · digest filter` : ""})
                </span>
              </label>
              <div style={{ display: "grid", gap: 12 }}>
                {slotsForList.map((slot) => (
                  <OperatorSlotListRow
                    key={slot.id}
                    slot={slot}
                    busy={rowAction.busyId === slot.id}
                    onPrimaryAction={handlePrimaryAction}
                    detailHref={slotsDetailPath(
                      slot.id,
                      slotsDetailParamsFromListContext({
                        filter,
                        slot,
                        digestKind,
                        digestSlotIds: digestSlotIdsParam ?? undefined,
                        q: searchParams.get("q"),
                      }),
                    )}
                    selection={{
                      selected: isSelected(slot.id),
                      onToggle: () => toggle(slot.id),
                    }}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      ) : null}

      <OperatorBulkActionBar
        count={selectedIds.length}
        busy={bulkRunning}
        onRetryOffers={() => {
          if (selectedIds.length === 0) return;
          setBulkPendingAction("retry_offers");
          setBulkConfirmOpen(true);
        }}
        onExpire={() => {
          if (selectedIds.length === 0) return;
          setBulkPendingAction("expire");
          setBulkConfirmOpen(true);
        }}
        onClear={() => clearBulkSelection()}
      />

      <OperatorBulkActionConfirmModal
        open={bulkConfirmOpen}
        action={bulkPendingAction}
        count={selectedIds.length}
        busy={bulkRunning}
        onCancel={() => {
          if (!bulkRunning) {
            setBulkConfirmOpen(false);
            setBulkPendingAction(null);
          }
        }}
        onConfirm={() => void confirmBulk()}
      />

      <OperatorBulkActionResult
        result={bulkResult}
        onDismiss={() => setBulkResult(null)}
      />
      </OperatorPageTransition>
    </main>
  );
}
