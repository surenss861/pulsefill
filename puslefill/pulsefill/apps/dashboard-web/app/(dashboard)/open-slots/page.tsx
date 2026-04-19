"use client";

import Link from "next/link";
import { ActionEmptyState } from "@/components/ui/action-empty-state";
import { SlotRowShell } from "@/components/ui/slot-row-shell";
import { StateChip } from "@/components/ui/state-chip";
import { useOpenSlots } from "@/hooks/useOpenSlots";

export default function OpenSlotsPage() {
  const { slots, loading, error, reload } = useOpenSlots();

  return (
    <main style={{ padding: 24 }}>
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
            style={{
              background: "transparent",
              border: "1px solid rgba(255,255,255,0.2)",
              color: "var(--text)",
              borderRadius: 12,
              padding: "8px 14px",
              cursor: "pointer",
            }}
          >
            Refresh
          </button>
        </div>
      </div>
      <p style={{ color: "var(--muted)", maxWidth: 640 }}>
        Slots for your business from <code style={{ color: "var(--primary)" }}>GET /v1/open-slots</code>. Open a row
        for offers, claims, and confirm booking.
      </p>

      {loading ? <p style={{ color: "var(--muted)" }}>Loading…</p> : null}
      {error ? <p style={{ color: "#f87171" }}>{error}</p> : null}

      {!loading && slots.length === 0 ? (
        <div style={{ marginTop: 24 }}>
          <ActionEmptyState
            title="No open slots yet"
            description="When a cancellation happens, create an open slot here and PulseFill can send it to matching standby customers."
            ctaLabel="Create slot"
            ctaHref="/open-slots/create"
          />
        </div>
      ) : null}

      <div style={{ marginTop: 20, display: "grid", gap: 12 }}>
        {slots.map((s) => (
          <Link
            key={s.id}
            href={`/open-slots/${s.id}`}
            style={{
              display: "block",
              textDecoration: "none",
              color: "inherit",
            }}
          >
            <SlotRowShell status={s.status} style={{ padding: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                <span style={{ fontWeight: 600 }}>{s.provider_name_snapshot ?? "Open slot"}</span>
                <StateChip status={s.status} />
              </div>
              <p style={{ margin: "8px 0 0", fontSize: 13, color: "var(--muted)" }}>
                {new Date(s.starts_at).toLocaleString()} → {new Date(s.ends_at).toLocaleString()}
              </p>
              {s.winning_claim ? (
                <p style={{ margin: "8px 0 0", fontSize: 12, color: "var(--primary)" }}>
                  Winner claim: {s.winning_claim.status}
                </p>
              ) : null}
            </SlotRowShell>
          </Link>
        ))}
      </div>
    </main>
  );
}
