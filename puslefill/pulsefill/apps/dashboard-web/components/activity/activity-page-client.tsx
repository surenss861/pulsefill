"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { DeskPageHeader } from "@/components/dashboard/desk/desk-page-header";
import { DeskSecondaryCard } from "@/components/dashboard/desk/desk-secondary-card";
import { OperatorPageTransition } from "@/components/operator/operator-page-transition";
import { OperatorLoadingState } from "@/components/operator/operator-loading-state";
import { ActivityEmptySection } from "@/components/activity/activity-empty-section";
import { OperatorActivityBulkActionBar } from "@/components/activity/operator-activity-bulk-action-bar";
import { OperatorActivityCard } from "@/components/activity/operator-activity-card";
import { OperatorBulkActionConfirmModal } from "@/components/slots/operator-bulk-action-confirm-modal";
import { OperatorBulkActionResult } from "@/components/slots/operator-bulk-action-result";
import { RefreshIndicator } from "@/components/ui/refresh-indicator";
import { PageState } from "@/components/ui/page-state";
import { useToast } from "@/components/ui/toast-provider";
import { useOperatorActivityBulkSelection } from "@/hooks/useOperatorActivityBulkSelection";
import { useOperatorActivityFeed } from "@/hooks/useOperatorActivityFeed";
import { useOperatorRefreshSubscription } from "@/hooks/useOperatorRefreshSubscription";
import {
  openSlotsUrlForActivitySelection,
  retrySelectedActivitySlots,
} from "@/lib/operator-activity-bulk-actions";
import { activityFeedErrorUi } from "@/lib/operator-activity-feed-errors";
import { emitOperatorRefreshAfterBulkSlotAction } from "@/lib/operator-refresh-events";
import { actionLinkStyle } from "@/lib/operator-action-link-styles";
import {
  matchesOperatorActivityFilter,
  operatorActivityFilterOptions,
  type OperatorActivityFilter,
} from "@/types/operator-activity-filter";
import type { BulkSlotActionResponse } from "@/types/bulk-actions";

export function ActivityPageClient() {
  const router = useRouter();
  const { showToast } = useToast();
  const { items, loading, error, reload } = useOperatorActivityFeed(30_000);

  const refreshActivitySilent = useCallback(() => {
    void reload({ silent: true });
  }, [reload]);

  useOperatorRefreshSubscription({
    onSlotUpdated: refreshActivitySilent,
    onSlotNoteUpdated: refreshActivitySilent,
  });
  const [filter, setFilter] = useState<OperatorActivityFilter>("all");
  const [refreshedAt, setRefreshedAt] = useState<Date | null>(null);
  const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false);
  const [bulkRunning, setBulkRunning] = useState(false);
  const [bulkResult, setBulkResult] = useState<BulkSlotActionResponse | null>(null);

  const filteredItems = useMemo(
    () => items.filter((item) => matchesOperatorActivityFilter(filter, item)),
    [items, filter],
  );

  const bulkSelection = useOperatorActivityBulkSelection(filteredItems);
  const { clear: clearBulkSelection, ...bulk } = bulkSelection;

  useEffect(() => {
    clearBulkSelection();
  }, [filter, clearBulkSelection]);

  useEffect(() => {
    if (!loading && items.length >= 0) setRefreshedAt(new Date());
  }, [loading, items.length]);

  async function runBulkRetry() {
    setBulkRunning(true);
    setBulkResult(null);
    try {
      const res = await retrySelectedActivitySlots(bulk.selectedSlotIds);
      if (res) {
        setBulkResult(res);
        emitOperatorRefreshAfterBulkSlotAction(res);
      }
      showToast({
        title: `Bulk retry finished — ${res?.message ?? "Done."}`,
        tone: "success",
      });
      clearBulkSelection();
      await reload({ silent: true });
    } catch (e) {
      showToast({
        title: `Bulk retry failed — ${e instanceof Error ? e.message : "Unknown error"}`,
        tone: "error",
      });
    } finally {
      setBulkRunning(false);
      setBulkConfirmOpen(false);
    }
  }

  const activityLoadError: ReactNode = useMemo(() => {
    if (!error) return null;
    const ui = activityFeedErrorUi(error);
    return (
      <PageState
        variant="error"
        title={ui.title}
        description={
          ui.suggestSignIn ? (
            <span>
              {ui.description}{" "}
              <Link href="/sign-in" style={actionLinkStyle("primary")}>
                Sign in again
              </Link>
              .
            </span>
          ) : (
            ui.description
          )
        }
      />
    );
  }, [error]);

  const headerActions = (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        flexWrap: "wrap",
        justifyContent: "flex-end",
      }}
    >
      <RefreshIndicator updatedAt={refreshedAt} />
      <Link href="/open-slots/create" className="pf-desk-save-access pf-desk-save-access--link">
        Create opening
      </Link>
      <button
        type="button"
        onClick={() => {
          void (async () => {
            await reload();
            setRefreshedAt(new Date());
          })();
        }}
        style={{
          background: "transparent",
          border: "1px solid rgba(255,255,255,0.2)",
          color: "var(--text)",
          borderRadius: 12,
          padding: "8px 14px",
          cursor: "pointer",
          fontSize: 13,
          fontWeight: 600,
        }}
      >
        Refresh
      </button>
    </div>
  );

  const bulkSelected = bulk.selectedIds.length > 0;

  return (
    <main
      className="pf-page-activity pf-desk-page"
      style={{ padding: 0, paddingBottom: bulkSelected ? 100 : 0 }}
    >
      <OperatorPageTransition>
        <div className="pf-overview-desk-stack">
          <DeskPageHeader
            title="Activity"
            subtitle="See openings, offers, claims, and confirmed bookings."
            actions={headerActions}
          />

          {activityLoadError ? (
            activityLoadError
          ) : loading && items.length === 0 ? (
            <OperatorLoadingState
              variant="section"
              skeleton="rows"
              title="Loading activity…"
              description="Fetching recent openings, offers, claims, and confirmations."
            />
          ) : (
            <DeskSecondaryCard title="Recent activity">
              <div className={`pf-filter-rail${items.length === 0 ? " pf-filter-rail--quiet" : ""}`}>
                {operatorActivityFilterOptions.map((opt) => {
                  const on = filter === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setFilter(opt.value)}
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        padding: "8px 14px",
                        borderRadius: 999,
                        border: on ? "1px solid rgba(255, 255, 255, 0.14)" : "1px solid var(--pf-border-subtle)",
                        background: on ? "rgba(255, 122, 24, 0.08)" : "rgba(255,255,255,0.03)",
                        color: on ? "var(--pf-text-primary)" : "rgba(245, 247, 250, 0.7)",
                        cursor: "pointer",
                        transition: "background 150ms ease, border-color 150ms ease, transform 120ms ease",
                      }}
                    >
                      {opt.label}
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => bulk.selectAllVisible()}
                  disabled={!filteredItems.some((i) => i.bulk_selectable)}
                  style={{
                    fontSize: 13,
                    marginLeft: "auto",
                    padding: "8px 12px",
                    borderRadius: 10,
                    border: "1px solid var(--pf-border-subtle)",
                    background: "transparent",
                    color: "rgba(245, 247, 250, 0.45)",
                    cursor: filteredItems.some((i) => i.bulk_selectable) ? "pointer" : "not-allowed",
                    opacity: filteredItems.some((i) => i.bulk_selectable) ? 1 : 0.5,
                  }}
                >
                  Select all visible
                </button>
              </div>

              <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 12 }}>
                {items.length === 0 ? (
                  <ActivityEmptySection />
                ) : filteredItems.length === 0 ? (
                  <ActivityEmptySection variant="filtered" />
                ) : (
                  filteredItems.map((item) => (
                    <OperatorActivityCard
                      key={item.id}
                      item={item}
                      showSelection
                      selected={bulk.selectedIds.includes(item.id)}
                      onToggleSelect={() => bulk.toggle(item.id)}
                    />
                  ))
                )}
              </div>
            </DeskSecondaryCard>
          )}
        </div>

        <OperatorActivityBulkActionBar
          count={bulk.selectedIds.length}
          busy={bulkRunning}
          onRetry={() => {
            if (bulk.selectedSlotIds.length === 0) return;
            setBulkConfirmOpen(true);
          }}
          onOpenInSlots={() => router.push(openSlotsUrlForActivitySelection(bulk.selectedSlotIds))}
          onClear={() => clearBulkSelection()}
        />

        <OperatorBulkActionConfirmModal
          open={bulkConfirmOpen}
          action="retry_offers"
          count={bulk.selectedSlotIds.length}
          busy={bulkRunning}
          onCancel={() => setBulkConfirmOpen(false)}
          onConfirm={() => void runBulkRetry()}
        />

        {bulkResult ? <OperatorBulkActionResult result={bulkResult} onDismiss={() => setBulkResult(null)} /> : null}
      </OperatorPageTransition>
    </main>
  );
}
