"use client";

import { OpsBreakdownSection } from "@/components/analytics/ops-breakdown-section";
import { useOpsBreakdown } from "@/hooks/useOpsBreakdown";

export default function AnalyticsPage() {
  const { data, loading, error, reload } = useOpsBreakdown();

  return (
    <main style={{ padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ marginTop: 0 }}>Analytics</h1>
          <p style={{ color: "var(--muted)", maxWidth: 560, marginBottom: 0 }}>
            Today&apos;s operational breakdown by provider, service, and location from{" "}
            <code style={{ color: "var(--primary)" }}>GET /v1/businesses/mine/ops-breakdown</code>.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void reload()}
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

      {loading && !data ? <p style={{ color: "var(--muted)", marginTop: 20 }}>Loading…</p> : null}
      {error ? <p style={{ color: "#f87171", marginTop: 16 }}>{error}</p> : null}

      {data ? (
        <div style={{ marginTop: 24, display: "grid", gap: 28 }}>
          <p style={{ margin: 0, fontSize: 13, color: "var(--muted)" }}>
            Window: {data.date_range.label} ({data.date_range.start_at} → {data.date_range.end_at})
          </p>
          <OpsBreakdownSection title="Providers" rows={data.providers} />
          <OpsBreakdownSection title="Services" rows={data.services} />
          <OpsBreakdownSection title="Locations" rows={data.locations} />
        </div>
      ) : null}
    </main>
  );
}
