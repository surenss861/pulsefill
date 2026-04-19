"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ClaimWinnerCard } from "@/components/claims/claim-winner-card";
import { ActionEmptyState } from "@/components/ui/action-empty-state";
import { RefreshIndicator } from "@/components/ui/refresh-indicator";
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

  return (
    <main style={{ padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ marginTop: 0 }}>Claims</h1>
          <p style={{ color: "var(--muted)", maxWidth: 560, marginBottom: 0 }}>
            Claimed slots for your business. Confirm the booking once the winner is locked in.
          </p>
        </div>
        <RefreshIndicator updatedAt={refreshedAt} />
      </div>

      {loading ? <p style={{ color: "var(--muted)" }}>Loading claims…</p> : null}
      {error ? <p style={{ color: "#f87171" }}>{error}</p> : null}

      {!loading && claims.length > 0 ? (
        <p style={{ marginTop: 16, fontSize: 13, color: "var(--muted)", lineHeight: 1.5 }}>
          {claimSummary.need > 0 ? (
            <span style={{ color: "#fcd34d", fontWeight: 600 }}>{claimSummary.need} need confirmation</span>
          ) : (
            <span>No confirmations pending</span>
          )}
          <span style={{ color: "var(--muted)" }}> · </span>
          <span>{claimSummary.done} confirmed</span>
          <span style={{ color: "var(--muted)" }}> · </span>
          <span>{claims.length} total</span>
        </p>
      ) : null}

      {!loading && claims.length === 0 ? (
        <div style={{ marginTop: 24 }}>
          <ActionEmptyState
            title="No claimed slots yet"
            description="When a customer accepts an earlier opening, it will appear here so staff can confirm the booking."
            ctaLabel="Go to open slots"
            ctaHref="/open-slots"
          />
        </div>
      ) : null}

      <div style={{ marginTop: 24, display: "grid", gap: 16 }}>
        {claims.map((c) => (
          <ClaimWinnerCard key={c.open_slot_id} claim={c} onConfirmed={reload} />
        ))}
      </div>
    </main>
  );
}
