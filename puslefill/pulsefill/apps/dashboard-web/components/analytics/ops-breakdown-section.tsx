"use client";

import type { OpsBreakdownRow } from "@/types/ops-breakdown";

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0,
  }).format((cents || 0) / 100);
}

type Props = {
  title: string;
  rows: OpsBreakdownRow[];
};

export function OpsBreakdownSection({ title, rows }: Props) {
  return (
    <div style={{ display: "grid", gap: 12 }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{title}</h2>

      {rows.length === 0 ? (
        <div style={{ opacity: 0.72, fontSize: 14 }}>No data yet.</div>
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {rows.map((row) => (
            <div
              key={row.id}
              style={{
                padding: 16,
                borderRadius: 18,
                border: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(255,255,255,0.03)",
                display: "grid",
                gap: 10,
              }}
            >
              <div style={{ fontSize: 16, fontWeight: 700 }}>{row.label}</div>
              <div style={{ fontSize: 13, opacity: 0.8 }}>
                {row.recovered_bookings} recovered · {formatCurrency(row.recovered_revenue_cents)} ·{" "}
                {row.awaiting_confirmation} awaiting · {row.delivery_failures} failures · {row.no_matches} no matches ·{" "}
                {row.active_offered_slots} offered
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
