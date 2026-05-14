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
import { DashboardRecoveryPathSection } from "@/components/dashboard/dashboard-recovery-path-section";
import { DeskHeroCard } from "@/components/dashboard/desk/desk-hero-card";
import { DeskPageHeader } from "@/components/dashboard/desk/desk-page-header";
import { DeskSecondaryCard } from "@/components/dashboard/desk/desk-secondary-card";
import type { RecoveryPipelineStepId } from "@/components/operator/recovery-pipeline";
import { OperatorErrorState } from "@/components/operator/operator-error-state";
import { OperatorLoadingState } from "@/components/operator/operator-loading-state";
import { OperatorPageTransition } from "@/components/operator/operator-page-transition";
import { MotionAction } from "@/components/operator/operator-motion-primitives";
import { matchesOperatorFilters, DEFAULT_OPERATOR_FILTERS } from "@/lib/operator-filters";
import type { DerivedOperatorPrimaryAction } from "@/lib/operator-primary-action";
import { digestSectionBannerTitle } from "@/lib/morning-recovery-digest-ui";
import {
  caseFileBandCopy,
  groupSlotsByCaseFileBand,
  OPENING_CASE_BAND_ORDER,
} from "@/lib/operator-open-slots-case-bands";
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

  const caseFileGroups = useMemo(() => groupSlotsByCaseFileBand(slotsForList), [slotsForList]);

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

  const openingsPipelineStep = useMemo((): RecoveryPipelineStepId => {
    if (slots.length === 0) return "opening";
    if ((counts.claimed ?? 0) > 0) return "confirmed";
    if ((counts.offered ?? 0) > 0) return "claim";
    if ((counts.open ?? 0) > 0) return "offers";
    if ((counts.booked ?? 0) > 0) return "confirmed";
    return "matched";
  }, [slots.length, counts.claimed, counts.offered, counts.open, counts.booked]);

  const headerActions = (
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
        fontSize: 13,
        fontWeight: 600,
      }}
    >
      {reloading ? "Refreshing…" : "Refresh"}
    </button>
  );

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
    <main className="pf-page-openings pf-desk-page" style={{ padding: 0, paddingBottom: selectedIds.length > 0 ? 120 : 0 }}>
      <OperatorPageTransition>
        <div className="pf-overview-desk-stack">
          <DeskPageHeader
            title="Openings"
            subtitle="Cancelled appointment times on your desk — grouped by what to do next."
            actions={headerActions}
          />

          <DeskHeroCard title="Create an opening" titleId="pf-openings-hero-title" eyebrow="When someone cancels">
            <p className="pf-desk-hero-card__meta">
              When someone cancels, add the appointment time here. PulseFill can send it to waiting customers.
            </p>
            <MotionAction>
              <Link href="/open-slots/create" className="pf-desk-save-access pf-desk-save-access--link">
                Create opening
              </Link>
            </MotionAction>
          </DeskHeroCard>

          {digestBanner ? (
            <aside className="pf-openings-digest-banner" aria-label="Digest context">
              <p className="pf-openings-digest-banner__meta">From your morning digest</p>
              <div className="pf-openings-digest-banner__title">{digestBanner.title}</div>
              <p className="pf-muted-copy" style={{ margin: "8px 0 0", fontSize: 13, lineHeight: 1.5 }}>
                {digestBanner.subtitle}
              </p>
              <Link href="/open-slots" className="pf-desk-quiet-link" style={{ display: "inline-block", marginTop: 10 }}>
                Clear digest view
              </Link>
            </aside>
          ) : null}

          {loading ? (
            <OperatorLoadingState variant="section" skeleton="rows" title="Loading openings…" />
          ) : null}
          {error ? <OperatorErrorState rawMessage={error} /> : null}

          {!loading && !error && slots.length === 0 ? (
            <div className="pf-desk-openings-split">
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <DeskSecondaryCard title="No openings yet">
                  <p className="pf-muted-copy" style={{ margin: 0, fontSize: 14, lineHeight: 1.55 }}>
                    When someone cancels, add the appointment time here. PulseFill can send it to waiting customers on your list.
                  </p>
                  <MotionAction style={{ marginTop: 12 }}>
                    <Link href="/open-slots/create" className="pf-desk-save-access pf-desk-save-access--link">
                      Create opening
                    </Link>
                  </MotionAction>
                  <Link href="/customers" className="pf-desk-quiet-link" style={{ display: "inline-block", marginTop: 14, fontSize: 13 }}>
                    Invite standby customers
                  </Link>
                  <details className="pf-overview-edu" style={{ marginTop: 16 }}>
                    <summary>Show how recovery works</summary>
                    <p className="pf-overview-edu__body">
                      Staff posts a cancelled time as an opening, PulseFill matches standby preferences, you send offers, a customer claims, and
                      you confirm once the appointment exists on the calendar.
                    </p>
                  </details>
                </DeskSecondaryCard>
              </div>
              <DeskSecondaryCard title="What happens next">
                <DashboardRecoveryPathSection hideTitle activeStep="opening" />
              </DeskSecondaryCard>
            </div>
          ) : null}

          {!loading && !error && slots.length > 0 ? (
            <div className="pf-desk-openings-split">
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <SendOffersPrereqCallout />
                <DeskSecondaryCard title="Find openings">
                  <p className="pf-muted-copy" style={{ margin: "0 0 14px", fontSize: 14, lineHeight: 1.55 }}>
                    Pick a status to match the front desk moment, then narrow by provider, location, or visit type.
                  </p>
                  <OperatorSlotListSummary counts={counts} tone="desk" />
                  <div style={{ marginTop: 14 }}>
                    <OperatorSlotListToolbar selectedFilter={filter} onChange={commitListFilter} counts={counts} tone="desk" />
                  </div>
                  {filterOptions.error ? (
                    <div className="pf-desk-invite-error" role="alert" style={{ marginTop: 12 }}>
                      Filter options did not load. Refresh the page or try again in a moment.
                    </div>
                  ) : null}
                  {!filterOptions.loading ? (
                    <>
                      <div style={{ marginTop: 14 }}>
                        <OperatorFilterBar
                          filters={filterState.filters}
                          onChange={filterState.setFilters}
                          onClear={() => filterState.setFilters(DEFAULT_OPERATOR_FILTERS)}
                          providers={filterOptions.providers}
                          locations={filterOptions.locations}
                          services={filterOptions.services}
                        />
                      </div>
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
                </DeskSecondaryCard>

                <DeskSecondaryCard title="Appointment files">
                  {slotsForList.length === 0 ? (
                    <p className="pf-muted-copy" style={{ margin: 0, fontSize: 14, lineHeight: 1.55 }}>
                      {digestSlotSet && digestFilteredSlots.length === 0
                        ? "No digest openings in this filtered view."
                        : getOperatorSlotEmptyCopy(filter)}
                    </p>
                  ) : (
                    <>
                      <p className="pf-muted-copy" style={{ margin: "0 0 14px", fontSize: 14, lineHeight: 1.55 }}>
                        Grouped by what the front desk should do next. Filters above still apply.
                      </p>
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
                          {digestSlotSet ? ", digest filter" : ""})
                        </span>
                      </label>
                      <div className="pf-openings-case-board" style={{ marginTop: 12 }}>
                        {OPENING_CASE_BAND_ORDER.map((band) => {
                          const rows = caseFileGroups.get(band) ?? [];
                          if (rows.length === 0) return null;
                          const copy = caseFileBandCopy(band);
                          return (
                            <section key={band} className="pf-openings-case-band" aria-labelledby={`pf-openings-case-${band}`}>
                              <header className="pf-openings-case-band__head">
                                <div className="pf-openings-case-band__copy">
                                  <h3 className="pf-openings-case-band__title" id={`pf-openings-case-${band}`}>
                                    {copy.title}
                                  </h3>
                                  <p className="pf-openings-case-band__subtitle">{copy.subtitle}</p>
                                </div>
                                <span className="pf-openings-case-band__count" aria-hidden>
                                  {rows.length}
                                </span>
                              </header>
                              <div className="pf-openings-case-band__rows">
                                {rows.map((slot) => (
                                  <div key={slot.id} className="pf-openings-case-file-row">
                                    <OperatorSlotListRow
                                      variant="desk"
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
                                  </div>
                                ))}
                              </div>
                            </section>
                          );
                        })}
                      </div>
                    </>
                  )}
                </DeskSecondaryCard>
              </div>
              <DeskSecondaryCard title="What happens next">
                <DashboardRecoveryPathSection hideTitle activeStep={openingsPipelineStep} />
              </DeskSecondaryCard>
            </div>
          ) : null}
        </div>

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

        <OperatorBulkActionResult result={bulkResult} onDismiss={() => setBulkResult(null)} />
      </OperatorPageTransition>
    </main>
  );
}
