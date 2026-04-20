"use client";

import { useEffect, useMemo, useState } from "react";
import { ActionQueueEmptyState } from "@/components/action-queue/action-queue-empty-state";
import { ActionQueueItemCard } from "@/components/action-queue/action-queue-item-card";
import { ActionQueueSection } from "@/components/action-queue/action-queue-section";
import { ActionQueueSummaryBar } from "@/components/action-queue/action-queue-summary-bar";
import { OperatorFilterBar } from "@/components/operator/operator-filter-bar";
import { OperatorSavedViews } from "@/components/operator/operator-saved-views";
import { RefreshIndicator } from "@/components/ui/refresh-indicator";
import { useActionQueue } from "@/hooks/useActionQueue";
import { useOperatorFilterOptions } from "@/hooks/useOperatorFilterOptions";
import { useOperatorFilters } from "@/hooks/useOperatorFilters";
import { useOperatorRowAction } from "@/hooks/useOperatorRowAction";
import { matchesOperatorFilters } from "@/lib/operator-filters";
import { deriveQueueInlinePrimaryAction } from "@/lib/operator-primary-action";
import type { ActionQueueFilter, ActionQueueItem } from "@/types/action-queue";

const filterTabs: Array<{ id: ActionQueueFilter; label: string }> = [
  { id: "all", label: "All" },
  { id: "needs_action", label: "Needs action" },
  { id: "review", label: "Review" },
  { id: "resolved", label: "Resolved" },
];

export default function ActionQueuePage() {
  const { data, loading, error, reload } = useActionQueue(15_000);
  const rowAction = useOperatorRowAction(() => reload({ silent: true }));
  const [filter, setFilter] = useState<ActionQueueFilter>("all");
  const [refreshedAt, setRefreshedAt] = useState<Date | null>(null);
  const opFilter = useOperatorFilters({
    filtersStorageKey: "pf.operator.action-queue.filters",
    viewsStorageKey: "pf.operator.action-queue.views",
  });
  const filterOptions = useOperatorFilterOptions();

  const filteredSections = useMemo(() => {
    if (!data) {
      return { needs_action: [] as ActionQueueItem[], review: [] as ActionQueueItem[], resolved: [] as ActionQueueItem[] };
    }
    const f = opFilter.filters;
    return {
      needs_action: data.sections.needs_action.filter((i) => matchesOperatorFilters(i, f)),
      review: data.sections.review.filter((i) => matchesOperatorFilters(i, f)),
      resolved: data.sections.resolved.filter((i) => matchesOperatorFilters(i, f)),
    };
  }, [data, opFilter.filters]);

  async function handleQueuePrimary(item: ActionQueueItem) {
    const inline = deriveQueueInlinePrimaryAction(item);
    if (!inline) return;

    const successTitle =
      inline.kind === "confirm_booking"
        ? "Booking confirmed"
        : inline.kind === "send_offers"
          ? "Offers sent"
          : "Offers retried";

    await rowAction.run({
      rowId: item.id,
      kind: inline.kind,
      openSlotId: item.open_slot_id,
      claimId: inline.kind === "confirm_booking" ? inline.claimId : null,
      successTitle,
    });
  }

  useEffect(() => {
    if (data && !loading) setRefreshedAt(new Date());
  }, [data, loading]);

  const show = useMemo(() => {
    if (!data) return { needs: true, review: true, resolved: true };
    if (filter === "all") return { needs: true, review: true, resolved: true };
    if (filter === "needs_action") return { needs: true, review: false, resolved: false };
    if (filter === "review") return { needs: false, review: true, resolved: false };
    return { needs: false, review: false, resolved: true };
  }, [data, filter]);

  return (
    <main style={{ padding: 0, maxWidth: 900 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 16,
          flexWrap: "wrap",
          marginBottom: 8,
        }}
      >
        <div>
          <h1 style={{ marginTop: 0 }}>Action queue</h1>
          <p style={{ color: "var(--muted)", maxWidth: 560, marginBottom: 0 }}>
            What needs action now, what to watch, and what recently resolved — derived from slots, claims, offers, and
            notifications.
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

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
        {filterTabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setFilter(t.id)}
            style={{
              borderRadius: 999,
              border: filter === t.id ? "1px solid rgba(56, 189, 248, 0.45)" : "1px solid rgba(255,255,255,0.12)",
              background: filter === t.id ? "rgba(56, 189, 248, 0.12)" : "rgba(255,255,255,0.04)",
              color: "var(--text)",
              padding: "6px 14px",
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {data ? (
        <div style={{ display: "grid", gap: 14, marginBottom: 20 }}>
          {filterOptions.error ? (
            <p style={{ color: "#f87171", fontSize: 13 }}>Filters: {filterOptions.error}</p>
          ) : null}
          {!filterOptions.loading ? (
            <>
              <OperatorFilterBar
                filters={opFilter.filters}
                onChange={opFilter.setFilters}
                providers={filterOptions.providers}
                locations={filterOptions.locations}
                services={filterOptions.services}
              />
              <OperatorSavedViews
                views={opFilter.views}
                onApply={opFilter.setFilters}
                onCreate={opFilter.createView}
                onDelete={opFilter.deleteView}
              />
            </>
          ) : (
            <p style={{ color: "var(--muted)", fontSize: 13 }}>Loading filter options…</p>
          )}
        </div>
      ) : null}

      {error ? <p style={{ color: "#f87171" }}>{error}</p> : null}
      {loading && !data ? <p style={{ color: "var(--muted)" }}>Loading action queue…</p> : null}

      {data ? (
        <>
          <ActionQueueSummaryBar summary={data.summary} />

          {show.needs ? (
            <ActionQueueSection
              title="Needs action now"
              subtitle="Highest urgency — confirm claims, fix failed deliveries, retry offers."
              count={filteredSections.needs_action.length}
            >
              {filteredSections.needs_action.length === 0 ? (
                <ActionQueueEmptyState title="Nothing urgent right now" body="When claims stall or notifications fail, they will show up here." />
              ) : (
                filteredSections.needs_action.map((item) => (
                  <ActionQueueItemCard
                    key={item.id}
                    item={item}
                    busy={rowAction.busyId === item.id}
                    onPrimaryAction={handleQueuePrimary}
                  />
                ))
              )}
            </ActionQueueSection>
          ) : null}

          {show.review ? (
            <ActionQueueSection
              title="Watch / review"
              subtitle="Awareness items — no matches, active offers, recently expired slots."
              count={filteredSections.review.length}
            >
              {filteredSections.review.length === 0 ? (
                <ActionQueueEmptyState title="No items to review" body="Offers in flight and edge cases will land here." />
              ) : (
                filteredSections.review.map((item) => (
                  <ActionQueueItemCard
                    key={item.id}
                    item={item}
                    busy={rowAction.busyId === item.id}
                    onPrimaryAction={handleQueuePrimary}
                  />
                ))
              )}
            </ActionQueueSection>
          ) : null}

          {show.resolved ? (
            <ActionQueueSection
              title="Recently resolved"
              subtitle="Bookings recovered in the last week (by slot created time)."
              count={filteredSections.resolved.length}
            >
              {filteredSections.resolved.length === 0 ? (
                <ActionQueueEmptyState title="No recent bookings yet" body="Confirmed slots will appear here as you recover cancellations." />
              ) : (
                filteredSections.resolved.map((item) => <ActionQueueItemCard key={item.id} item={item} />)
              )}
            </ActionQueueSection>
          ) : null}
        </>
      ) : null}
    </main>
  );
}
