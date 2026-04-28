"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityEmptySection } from "@/components/activity/activity-empty-section";
import { ActivityHero } from "@/components/activity/activity-hero";
import { ActivitySummaryStrip } from "@/components/activity/activity-summary-strip";
import { ActionButton } from "@/components/ui/action-button";
import { PageState } from "@/components/ui/page-state";
import { SectionCard } from "@/components/ui/section-card";
import { OperatorActivityBulkActionBar } from "@/components/activity/operator-activity-bulk-action-bar";
import { OperatorActivityCard } from "@/components/activity/operator-activity-card";
import { OperatorBulkActionConfirmModal } from "@/components/slots/operator-bulk-action-confirm-modal";
import { OperatorBulkActionResult } from "@/components/slots/operator-bulk-action-result";
import { RefreshIndicator } from "@/components/ui/refresh-indicator";
import { useToast } from "@/components/ui/toast-provider";
import { useOperatorActivityBulkSelection } from "@/hooks/useOperatorActivityBulkSelection";
import { useOperatorActivityFeed } from "@/hooks/useOperatorActivityFeed";
import { useOperatorRefreshSubscription } from "@/hooks/useOperatorRefreshSubscription";
import {
  openSlotsUrlForActivitySelection,
  retrySelectedActivitySlots,
} from "@/lib/operator-activity-bulk-actions";
import { buildOperatorActivitySemanticSections } from "@/lib/operator-activity-semantic-sections";
import { emitOperatorRefreshAfterBulkSlotAction } from "@/lib/operator-refresh-events";
import { summarizeOperatorActivityFeed } from "@/lib/operator-activity-summary";
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

  const summary = useMemo(() => summarizeOperatorActivityFeed(items), [items]);
  const semanticSections = useMemo(
    () => buildOperatorActivitySemanticSections(filteredItems),
    [filteredItems],
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

  const heroActions = (
    <>
      <RefreshIndicator updatedAt={refreshedAt} />
      <ActionButton
        variant="secondary"
        onClick={() => {
          void (async () => {
            await reload();
            setRefreshedAt(new Date());
          })();
        }}
      >
        Refresh
      </ActionButton>
    </>
  );

  return (
    <main style={{ padding: 0, maxWidth: 1080 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <ActivityHero actions={heroActions} />
        <ActivitySummaryStrip summary={summary} />

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            alignItems: "center",
          }}
        >
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

        {error ? (
          <PageState variant="error" title="Could not load activity" description={error} />
        ) : loading && items.length === 0 ? (
          <p style={{ color: "rgba(245, 247, 250, 0.45)", margin: 0, fontSize: 14 }}>Loading activity…</p>
        ) : items.length === 0 ? (
          <ActivityEmptySection />
        ) : filteredItems.length === 0 ? (
          <ActivityEmptySection variant="filtered" />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
            {semanticSections.map((section) => (
              <SectionCard key={section.key} eyebrow={section.label} title={section.title} description={section.body}>
                {section.items.length === 0 ? (
                  <ActivityEmptySection />
                ) : (
                  section.items.map((item) => (
                    <OperatorActivityCard
                      key={item.id}
                      item={item}
                      showSelection
                      selected={bulk.selectedIds.includes(item.id)}
                      onToggleSelect={() => bulk.toggle(item.id)}
                    />
                  ))
                )}
              </SectionCard>
            ))}
          </div>
        )}

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
      </div>
    </main>
  );
}
