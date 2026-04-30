"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useOperatorRefreshSubscription } from "@/hooks/useOperatorRefreshSubscription";
import { ClaimWinnerCard } from "@/components/claims/claim-winner-card";
import { PageCommandHeader } from "@/components/operator/page-command-header";
import { OperatorEmptyState } from "@/components/operator/operator-empty-state";
import { OperatorMetricStrip } from "@/components/operator/operator-metric-strip";
import { RefreshIndicator } from "@/components/ui/refresh-indicator";
import { actionLinkStyle } from "@/lib/operator-action-link-styles";
import { useClaims } from "@/hooks/useClaims";
import { useClaimsRealtime } from "@/hooks/useClaimsRealtime";
import { usePollingEffect } from "@/hooks/usePollingEffect";

export default function ClaimsPage() {
  const { claims, loading, error, reload } = useClaims();
  const [refreshedAt, setRefreshedAt] = useState<Date | null>(null);

  const silentReload = useCallback(async () => {
    await reload({ silent: true });
    setRefreshedAt(new Date());
  }, [reload]);

  useOperatorRefreshSubscription({
    onSlotUpdated: () => {
      void silentReload();
    },
  });

  useEffect(() => {
    if (!loading) setRefreshedAt(new Date());
  }, [loading]);

  usePollingEffect(
    () => {
      void silentReload();
    },
    15000,
    !loading,
  );

  useClaimsRealtime(silentReload, !loading);

  const claimSummary = useMemo(() => {
    const need = claims.filter((c) => c.slot_status === "claimed").length;
    const done = claims.filter((c) => c.slot_status === "booked").length;
    return { need, done };
  }, [claims]);

  const metricItems = useMemo(
    () => [
      {
        label: "Awaiting confirmation",
        value: claimSummary.need,
        emphasis: "primary" as const,
        signal: claimSummary.need > 0 ? ("live" as const) : ("idle" as const),
      },
      { label: "Confirmed", value: claimSummary.done, signal: "idle" as const },
      { label: "Total in list", value: claims.length, signal: "idle" as const },
    ],
    [claimSummary.need, claimSummary.done, claims.length],
  );

  return (
    <main className="pf-page-claims" style={{ padding: "clamp(16px, 3vw, 24px) 0 32px" }}>
      <PageCommandHeader
        animate={false}
        tone="default"
        eyebrow="Decision queue"
        title="Claims"
        description="Review customers who claimed openings and confirm recoverable bookings."
        meta={<RefreshIndicator updatedAt={refreshedAt} />}
        style={{ marginBottom: 18 }}
      />

      {loading ? <p className="pf-muted-copy">Loading claims…</p> : null}
      {error ? <p style={{ color: "#f87171" }}>{error}</p> : null}

      {!loading && claims.length > 0 ? (
        <div className="pf-filter-rail" style={{ marginTop: 4, marginBottom: 16 }}>
          <OperatorMetricStrip items={metricItems} compact />
        </div>
      ) : null}

      {!loading && claims.length === 0 ? (
        <div style={{ marginTop: 8 }}>
          <OperatorEmptyState
            title="No claims waiting"
            description="When customers claim openings, they'll appear here for confirmation."
            primaryAction={
              <Link href="/open-slots" style={actionLinkStyle("primary")}>
                View openings
              </Link>
            }
          />
        </div>
      ) : null}

      <div style={{ marginTop: 8, display: "grid", gap: 14 }}>
        {claims.map((c) => (
          <ClaimWinnerCard key={c.open_slot_id} claim={c} />
        ))}
      </div>
    </main>
  );
}
