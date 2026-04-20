"use client";

import type { OpsBreakdownResponse } from "@/types/ops-breakdown";

type Props = {
  data: OpsBreakdownResponse;
};

export function OpsBreakdownHighlights({ data }: Props) {
  const h = data.highlights;

  const items = [
    ["Top provider", h.top_provider_by_recovered_bookings || "—"],
    ["Most no-match", h.top_service_by_no_matches || "—"],
    ["Most failures", h.top_location_by_failures || "—"],
  ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        gap: 12,
      }}
    >
      {items.map(([label, value]) => (
        <div
          key={label}
          style={{
            padding: "14px 16px",
            borderRadius: 18,
            border: "1px solid rgba(255,255,255,0.08)",
            background: "rgba(255,255,255,0.03)",
          }}
        >
          <div style={{ fontSize: 12, opacity: 0.7 }}>{label}</div>
          <div style={{ fontSize: 18, fontWeight: 700, marginTop: 6 }}>{value}</div>
        </div>
      ))}
    </div>
  );
}
