"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { DeskSecondaryCard } from "@/components/dashboard/desk/desk-secondary-card";
import { DeskFilePage } from "@/components/dashboard/desk/desk-artifacts";
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
import type { OperatorActivityItem } from "@/types/operator-activity-feed";
import { operatorActivityKindAccentColor } from "@/lib/operator-activity-presentation";

function startOfLocalDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

function formatLedgerDayLabel(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.round((startOfLocalDay(now) - startOfLocalDay(d)) / 86400000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return d.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" });
}

function formatLedgerClock(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

function groupActivityByLocalDay(items: OperatorActivityItem[]): { dayLabel: string; items: OperatorActivityItem[] }[] {
  const map = new Map<string, OperatorActivityItem[]>();
  for (const item of items) {
    const d = new Date(item.occurred_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(item);
  }
  const keys = [...map.keys()].sort((a, b) => (a < b ? 1 : a > b ? -1 : 0));
  return keys.map((key) => {
    const list = map.get(key)!;
    list.sort((a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime());
    return { dayLabel: formatLedgerDayLabel(list[0].occurred_at), items: list };
  });
}

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

  const ledgerGroups = useMemo(() => groupActivityByLocalDay(filteredItems), [filteredItems]);

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
        <DeskFilePage
          filingLine="04 · Recovery log"
          title="Recovery log"
          subtitle="The paper trail for openings, offers, claims, messages, and team notes."
          coverAside={headerActions}
        >
          {activityLoadError ? (
            activityLoadError
          ) : loading && items.length === 0 ? (
            <OperatorLoadingState
              variant="section"
              skeleton="rows"
              title="Loading recovery log…"
              description="Fetching recent openings, offers, claims, confirmations, delivery issues, and team notes."
            />
          ) : (
            <DeskSecondaryCard variant="ledger" title="Chronicle">
              <p className="pf-muted-copy" style={{ margin: "0 0 12px", fontSize: 14, lineHeight: 1.55 }}>
                Use the scan controls to filter, then open a row for the full story.
              </p>
              <div
                className={`pf-filter-rail pf-activity-scan-rail${items.length === 0 ? " pf-filter-rail--quiet" : ""}`}
                role="tablist"
                aria-label="Log scan controls"
              >
                {operatorActivityFilterOptions.map((opt) => {
                  const on = filter === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      role="tab"
                      className="pf-desk-status-pill"
                      aria-selected={on}
                      onClick={() => setFilter(opt.value)}
                    >
                      {opt.label}
                    </button>
                  );
                })}
                <span style={{ flex: "1 1 12px", minWidth: 8 }} aria-hidden />
                {filter !== "all" ? (
                  <button type="button" className="pf-desk-quiet-link" style={{ fontSize: 13, whiteSpace: "nowrap" }} onClick={() => setFilter("all")}>
                    Show entire log
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => bulk.selectAllVisible()}
                  disabled={!filteredItems.some((i) => i.bulk_selectable)}
                  style={{
                    fontSize: 13,
                    whiteSpace: "nowrap",
                    padding: "8px 14px",
                    borderRadius: 10,
                    border: "1px solid var(--pf-border-subtle)",
                    background: "transparent",
                    color: "rgba(245, 247, 250, 0.78)",
                    cursor: filteredItems.some((i) => i.bulk_selectable) ? "pointer" : "not-allowed",
                    opacity: filteredItems.some((i) => i.bulk_selectable) ? 1 : 0.5,
                    fontWeight: 600,
                    fontFamily: "inherit",
                  }}
                >
                  Select listed items
                </button>
              </div>

              <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 16 }}>
                {items.length === 0 ? (
                  <ActivityEmptySection />
                ) : filteredItems.length === 0 ? (
                  <ActivityEmptySection variant="filtered" />
                ) : (
                  <div className="pf-activity-ledger">
                    {ledgerGroups.map((group) => (
                      <section
                        key={group.items[0]?.occurred_at.slice(0, 10) ?? group.dayLabel}
                        className="pf-activity-ledger-day-block"
                        aria-label={group.dayLabel}
                      >
                        <div className="pf-activity-ledger-day-head">
                          <span className="pf-activity-ledger-day-label">{group.dayLabel}</span>
                          <span className="pf-activity-ledger-day-rule" aria-hidden />
                        </div>
                        <div className="pf-activity-ledger-rows">
                          {group.items.map((item) => (
                            <div key={item.id} className="pf-activity-ledger-row">
                              <div className="pf-activity-ledger-rail" aria-hidden>
                                <span className="pf-activity-ledger-time">{formatLedgerClock(item.occurred_at)}</span>
                                <span
                                  className="pf-activity-ledger-dot"
                                  style={{ background: operatorActivityKindAccentColor(item.kind) }}
                                />
                              </div>
                              <div className="pf-activity-ledger-card">
                                <OperatorActivityCard
                                  item={item}
                                  showSelection
                                  selected={bulk.selectedIds.includes(item.id)}
                                  onToggleSelect={() => bulk.toggle(item.id)}
                                  showRelativeTime={false}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </section>
                    ))}
                  </div>
                )}
              </div>
            </DeskSecondaryCard>
          )}
        </DeskFilePage>

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
