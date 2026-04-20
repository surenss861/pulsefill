"use client";

import type { OperatorStandbyPreferenceSnapshot } from "@/types/operator-customer-context";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function daysLabel(days: number[]) {
  if (!days.length) return "Any day";
  return [...days]
    .sort((a, b) => a - b)
    .map((d) => DAY_NAMES[d] ?? String(d))
    .join(", ");
}

type Props = {
  preferences: OperatorStandbyPreferenceSnapshot[];
};

export function StandbyPreferenceSnapshot({ preferences }: Props) {
  if (preferences.length === 0) {
    return (
      <div
        style={{
          borderRadius: 18,
          border: "1px dashed rgba(255,255,255,0.12)",
          padding: 16,
          fontSize: 14,
          color: "var(--muted)",
        }}
      >
        No standby preferences on file for this business yet. This customer may have claimed via another path.
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: 12 }}>
      {preferences.map((p) => (
        <div
          key={p.id}
          style={{
            borderRadius: 16,
            border: "1px solid rgba(255,255,255,0.08)",
            background: "rgba(0,0,0,0.22)",
            padding: 16,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <p style={{ margin: 0, fontSize: 16, fontWeight: 650 }}>
              {p.service_name ?? "Any service"} · {p.business_name ?? "Business"}
            </p>
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                color: p.active ? "#6ee7b7" : "var(--muted)",
              }}
            >
              {p.active ? "Active" : "Paused"}
            </span>
          </div>
          <p style={{ margin: "10px 0 0", fontSize: 13, color: "var(--muted)", lineHeight: 1.5 }}>
            {[p.location_name, p.provider_name].filter(Boolean).join(" · ") || "Any location / provider"}
          </p>
          <p style={{ margin: "10px 0 0", fontSize: 13, color: "var(--text)" }}>
            <span style={{ color: "var(--muted)" }}>Window · </span>
            {daysLabel(p.days_of_week)}
            {p.earliest_time && p.latest_time
              ? ` · ${p.earliest_time}–${p.latest_time}`
              : p.earliest_time || p.latest_time
                ? ` · ${p.earliest_time ?? "—"}–${p.latest_time ?? "—"}`
                : ""}
            {p.max_notice_hours != null ? ` · up to ${p.max_notice_hours}h notice` : ""}
            {p.deposit_ok ? " · deposit ok" : ""}
          </p>
        </div>
      ))}
    </div>
  );
}
