import { SectionCard } from "@/components/ui/section-card";
import type { OutcomesPerformanceRow } from "@/lib/outcomes-page-data";

type OutcomesPerformanceTableProps = {
  rows: OutcomesPerformanceRow[];
};

export function OutcomesPerformanceTable({ rows }: OutcomesPerformanceTableProps) {
  return (
    <SectionCard eyebrow="Performance" title="Recovery by operating segment">
      <div
        style={{
          overflowX: "auto",
          borderRadius: "var(--pf-radius-md)",
          border: "1px solid var(--pf-border-subtle)",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0,1.2fr) repeat(3, minmax(0,0.9fr))",
            gap: 8,
            borderBottom: rows.length > 0 ? "1px solid var(--pf-border-subtle)" : undefined,
            background: "rgba(255,255,255,0.03)",
            padding: "12px 16px",
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "rgba(245, 247, 250, 0.38)",
          }}
        >
          <div>Segment</div>
          <div>Recovered</div>
          <div>Lost</div>
          <div>Rate</div>
        </div>

        {rows.length === 0 ? (
          <div style={{ padding: "16px 18px", fontSize: 14, color: "rgba(245, 247, 250, 0.5)" }}>
            No location-level recovery signal for today yet.
          </div>
        ) : null}

        {rows.map((row, i) => (
          <div
            key={row.label}
            className="pf-outcomes-perf-row"
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0,1.2fr) repeat(3, minmax(0,0.9fr))",
              gap: 8,
              borderBottom: i < rows.length - 1 ? "1px solid var(--pf-border-subtle)" : undefined,
              padding: "14px 16px",
              fontSize: 14,
              color: "rgba(245, 247, 250, 0.72)",
            }}
          >
            <div style={{ fontWeight: 600, color: "rgba(245, 247, 250, 0.88)" }}>{row.label}</div>
            <div>{row.recovered}</div>
            <div>{row.lost}</div>
            <div>{row.rate}</div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
