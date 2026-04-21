"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { OperatorFilterBar } from "@/components/operator/operator-filter-bar";
import { OperatorSavedViews } from "@/components/operator/operator-saved-views";
import { OperatorBulkActionBar } from "@/components/slots/operator-bulk-action-bar";
import { OperatorBulkActionConfirmModal } from "@/components/slots/operator-bulk-action-confirm-modal";
import { OperatorBulkActionResult } from "@/components/slots/operator-bulk-action-result";
import { OperatorSlotListRow } from "@/components/slots/operator-slot-list-row";
import { OperatorSlotListSummary } from "@/components/slots/operator-slot-list-summary";
import { OperatorSlotListToolbar } from "@/components/slots/operator-slot-list-toolbar";
import { ActionEmptyState } from "@/components/ui/action-empty-state";
import { useToast } from "@/components/ui/toast-provider";
import { useBulkSelection } from "@/hooks/useBulkSelection";
import { useOperatorFilterOptions } from "@/hooks/useOperatorFilterOptions";
import { useOperatorFilters } from "@/hooks/useOperatorFilters";
import { useOperatorRowAction } from "@/hooks/useOperatorRowAction";
import { useOperatorRefreshSubscription } from "@/hooks/useOperatorRefreshSubscription";
import { useOperatorSlotsList } from "@/hooks/useOperatorSlotsList";
import { runOperatorBulkAction } from "@/lib/operator-bulk-actions";
import { emitOperatorRefreshAfterBulkSlotAction } from "@/lib/operator-refresh-events";
import { matchesOperatorFilters } from "@/lib/operator-filters";
import type { DerivedOperatorPrimaryAction } from "@/lib/operator-primary-action";
import { digestSectionBannerTitle } from "@/lib/morning-recovery-digest-ui";
import { getOperatorSlotEmptyCopy } from "@/lib/operator-slots-ui";
import type { BulkSlotActionKind, BulkSlotActionResponse } from "@/types/bulk-actions";
import type { OperatorSlotsFilter, OperatorSlotsListItem } from "@/types/operator-slots-list";

function OpenSlotsPageInner() {
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

  const [filter, setFilter] = useState<OperatorSlotsFilter>("all");
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

  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => isSelected(id));

  const digestBanner =
    digestKind && digestSlotSet
      ? {
          title: digestSectionBannerTitle(digestKind),
          subtitle:
            digestFilteredSlots.length === 0
              ? "None of these slots match your current tab/filters. Try “All” or clear filters."
              : `Showing ${digestFilteredSlots.length} of ${digestSlotSet.size} digest slot${
                  digestSlotSet.size === 1 ? "" : "s"
                } that match this view.`,
        }
      : digestKind
        ? {
            title: digestSectionBannerTitle(digestKind),
            subtitle: "Review the list below, or adjust filters to match digest slots.",
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
    <main style={{ padding: 24, paddingBottom: selectedIds.length > 0 ? 120 : 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
        <h1 style={{ marginTop: 0 }}>Open slots</h1>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <Link
            href="/open-slots/create"
            style={{
              borderRadius: 12,
              border: "none",
              background: "var(--primary)",
              color: "#0a0c10",
              padding: "8px 14px",
              fontSize: 14,
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Create slot
          </Link>
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
      </div>
      <p style={{ color: "var(--muted)", maxWidth: 640 }}>
        Scan all openings, filter by state, and take the next action fast. Data from{" "}
        <code style={{ color: "var(--primary)" }}>GET /v1/open-slots/mine</code>.
      </p>

      {digestBanner ? (
        <div
          style={{
            marginTop: 16,
            padding: 14,
            borderRadius: 14,
            border: "1px solid rgba(96,165,250,0.35)",
            background: "rgba(59,130,246,0.12)",
          }}
        >
          <div style={{ fontSize: 12, color: "#93c5fd", letterSpacing: "0.04em", textTransform: "uppercase" }}>
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

      {loading ? <p style={{ color: "var(--muted)" }}>Loading…</p> : null}
      {error ? <p style={{ color: "#f87171" }}>{error}</p> : null}

      {!loading && !error && slots.length === 0 ? (
        <div style={{ marginTop: 24 }}>
          <ActionEmptyState
            title="No open slots yet"
            description="When a cancellation happens, create an open slot here and PulseFill can send it to matching standby customers."
            ctaLabel="Create slot"
            ctaHref="/open-slots/create"
          />
        </div>
      ) : null}

      {!loading && !error && slots.length > 0 ? (
        <div style={{ marginTop: 20, display: "grid", gap: 18 }}>
          <OperatorSlotListSummary counts={counts} />
          <OperatorSlotListToolbar selectedFilter={filter} onChange={setFilter} counts={counts} />

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
                ? "No digest slots in this filtered view."
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
    </main>
  );
}

export default function OpenSlotsPage() {
  return (
    <Suspense
      fallback={
        <main style={{ padding: 24 }}>
          <p style={{ color: "var(--muted)" }}>Loading open slots…</p>
        </main>
      }
    >
      <OpenSlotsPageInner />
    </Suspense>
  );
}
