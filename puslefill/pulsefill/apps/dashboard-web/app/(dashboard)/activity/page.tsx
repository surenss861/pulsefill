"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
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
import { emitOperatorRefreshAfterBulkSlotAction } from "@/lib/operator-refresh-events";
import { groupOperatorActivityItems } from "@/lib/operator-activity-grouping";
import {
  matchesOperatorActivityFilter,
  operatorActivityFilterOptions,
  type OperatorActivityFilter,
} from "@/types/operator-activity-filter";
import type { BulkSlotActionResponse } from "@/types/bulk-actions";

export default function OperatorActivityPage() {
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

  const sections = useMemo(() => groupOperatorActivityItems(filteredItems), [filteredItems]);

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

  return (
    <div style={{ maxWidth: 920 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 16 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 750 }}>Activity</h1>
          <p style={{ margin: "8px 0 0", color: "var(--muted)", fontSize: 14, lineHeight: 1.45 }}>
            Operator timeline for your business. Select rows to retry offers in batch or jump to slots.
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <RefreshIndicator updatedAt={refreshedAt} />
          <button
            type="button"
            onClick={() => {
              void (async () => {
                await reload();
                setRefreshedAt(new Date());
              })();
            }}
            style={{
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.18)",
              background: "rgba(255,255,255,0.06)",
              color: "var(--text)",
              padding: "8px 14px",
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            Refresh
          </button>
        </div>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 18 }}>
        {operatorActivityFilterOptions.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setFilter(opt.value)}
            style={{
              fontSize: 13,
              fontWeight: 600,
              padding: "8px 12px",
              borderRadius: 999,
              border:
                filter === opt.value ? "1px solid rgba(56,189,248,0.45)" : "1px solid rgba(255,255,255,0.1)",
              background: filter === opt.value ? "rgba(14,165,233,0.12)" : "rgba(255,255,255,0.03)",
              color: "inherit",
              cursor: "pointer",
            }}
          >
            {opt.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => bulk.selectAllVisible()}
          disabled={!filteredItems.some((i) => i.bulk_selectable)}
          style={{
            fontSize: 13,
            marginLeft: "auto",
            padding: "8px 12px",
            borderRadius: 8,
            border: "1px solid rgba(255,255,255,0.12)",
            background: "transparent",
            color: "var(--muted)",
            cursor: "pointer",
          }}
        >
          Select all visible
        </button>
      </div>

      {error ? (
        <p style={{ color: "#fca5a5", marginTop: 16 }}>{error}</p>
      ) : loading && items.length === 0 ? (
        <p style={{ color: "var(--muted)", marginTop: 20 }}>Loading activity…</p>
      ) : filteredItems.length === 0 ? (
        <p style={{ color: "var(--muted)", marginTop: 20 }}>No items match this filter.</p>
      ) : (
        <div style={{ marginTop: 20, display: "grid", gap: 18 }}>
          {sections.map((section) => (
            <div key={section.title}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: 0.6,
                  color: "var(--muted)",
                  marginBottom: 10,
                }}
              >
                {section.title.toUpperCase()}
              </div>
              <div style={{ display: "grid", gap: 10 }}>
                {section.items.map((item) => (
                  <OperatorActivityCard
                    key={item.id}
                    item={item}
                    showSelection
                    selected={bulk.selectedIds.includes(item.id)}
                    onToggleSelect={() => bulk.toggle(item.id)}
                  />
                ))}
              </div>
            </div>
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

      {bulkResult ? (
        <OperatorBulkActionResult
          result={bulkResult}
          onDismiss={() => setBulkResult(null)}
        />
      ) : null}
    </div>
  );
}
