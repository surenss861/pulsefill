"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { ActionQueueEmptyState } from "@/components/action-queue/action-queue-empty-state";
import { ActionQueueItemCard } from "@/components/action-queue/action-queue-item-card";
import { ActionQueuePageHeader } from "@/components/action-queue/action-queue-page-header";
import { ActionQueueSection } from "@/components/action-queue/action-queue-section";
import { ActionQueueSummaryBar } from "@/components/action-queue/action-queue-summary-bar";
import { OperatorFilterBar } from "@/components/operator/operator-filter-bar";
import { OperatorSavedViews } from "@/components/operator/operator-saved-views";
import { RefreshIndicator } from "@/components/ui/refresh-indicator";
import { useActionQueue } from "@/hooks/useActionQueue";
import { useOperatorRefreshSubscription } from "@/hooks/useOperatorRefreshSubscription";
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

function parseQueueSectionParam(value: string | null): ActionQueueFilter {
  if (value === "needs_action" || value === "review" || value === "resolved") return value;
  return "all";
}

function ActionQueuePageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data, loading, error, reload } = useActionQueue(15_000);
  const [filter, setFilter] = useState<ActionQueueFilter>(() => parseQueueSectionParam(searchParams.get("section")));
  const [refreshedAt, setRefreshedAt] = useState<Date | null>(null);
  const rowAction = useOperatorRowAction(() => reload({ silent: true }));
  const refreshQueueSilent = useCallback(() => {
    void reload({ silent: true });
    setRefreshedAt(new Date());
  }, [reload]);
  useOperatorRefreshSubscription({
    onSlotUpdated: refreshQueueSilent,
  });
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

  useEffect(() => {
    setFilter(parseQueueSectionParam(searchParams.get("section")));
  }, [searchParams]);

  const applyQueueFilter = useCallback(
    (next: ActionQueueFilter) => {
      setFilter(next);
      const nextSearch = new URLSearchParams(searchParams.toString());
      if (next === "all") nextSearch.delete("section");
      else nextSearch.set("section", next);
      const qs = nextSearch.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [router, pathname, searchParams],
  );

  const show = useMemo(() => {
    if (!data) return { needs: true, review: true, resolved: true };
    if (filter === "all") return { needs: true, review: true, resolved: true };
    if (filter === "needs_action") return { needs: true, review: false, resolved: false };
    if (filter === "review") return { needs: false, review: true, resolved: false };
    return { needs: false, review: false, resolved: true };
  }, [data, filter]);

  return (
    <main style={{ padding: 0, maxWidth: 900 }}>
      <ActionQueuePageHeader>
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
      </ActionQueuePageHeader>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
        {filterTabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => applyQueueFilter(t.id)}
            style={{
              borderRadius: 999,
              border:
                filter === t.id ? "1px solid var(--pf-accent-primary-border)" : "1px solid rgba(255,255,255,0.12)",
              background: filter === t.id ? "rgba(255, 122, 26, 0.1)" : "rgba(255,255,255,0.04)",
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
      {loading && !data ? <p style={{ color: "var(--muted)" }}>Loading queue…</p> : null}

      {data ? (
        <>
          <ActionQueueSummaryBar summary={data.summary} />

          {show.needs ? (
            <ActionQueueSection
              title="Needs action"
              subtitle="Slots waiting on confirmation, retry, or operator intervention right now."
              count={filteredSections.needs_action.length}
            >
              {filteredSections.needs_action.length === 0 ? (
                <ActionQueueEmptyState
                  title="Nothing urgent right now"
                  body="Review lower-priority items below."
                />
              ) : (
                filteredSections.needs_action.map((item) => (
                  <ActionQueueItemCard
                    key={item.id}
                    item={item}
                    section="needs_action"
                    busy={rowAction.busyId === item.id}
                    onPrimaryAction={handleQueuePrimary}
                  />
                ))
              )}
            </ActionQueueSection>
          ) : null}

          {show.review ? (
            <ActionQueueSection
              title="Review"
              subtitle="Slots worth checking once urgent recovery work is handled."
              count={filteredSections.review.length}
            >
              {filteredSections.review.length === 0 ? (
                <ActionQueueEmptyState title="Nothing waiting in review" />
              ) : (
                filteredSections.review.map((item) => (
                  <ActionQueueItemCard
                    key={item.id}
                    item={item}
                    section="review"
                    busy={rowAction.busyId === item.id}
                    onPrimaryAction={handleQueuePrimary}
                  />
                ))
              )}
            </ActionQueueSection>
          ) : null}

          {show.resolved ? (
            <ActionQueueSection
              title="Resolved"
              subtitle="Recently handled or recovered slots kept visible for short-term follow-through."
              count={filteredSections.resolved.length}
            >
              {filteredSections.resolved.length === 0 ? (
                <ActionQueueEmptyState title="No recently resolved items" body="Confirmed slots will appear here as you recover cancellations." />
              ) : (
                filteredSections.resolved.map((item) => (
                  <ActionQueueItemCard key={item.id} item={item} section="resolved" />
                ))
              )}
            </ActionQueueSection>
          ) : null}
        </>
      ) : null}
    </main>
  );
}

export default function ActionQueuePage() {
  return (
    <Suspense
      fallback={
        <main style={{ padding: 24, maxWidth: 900 }}>
          <p style={{ color: "var(--muted)" }}>Loading queue…</p>
        </main>
      }
    >
      <ActionQueuePageContent />
    </Suspense>
  );
}
