"use client";

import Link from "next/link";
import { MotionAction } from "@/components/operator/operator-motion-primitives";
import { SectionCard } from "@/components/ui/section-card";
import type { RecoveryInsightsData } from "@/lib/recovery-insights-data";
import { actionLinkStyle } from "@/lib/operator-action-link-styles";

type Props = {
  data: RecoveryInsightsData;
};

function isDrilldownServiceId(id: string): boolean {
  if (!id || id === "__unassigned__") return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        borderRadius: "var(--pf-radius-md)",
        border: "1px solid var(--pf-border-subtle)",
        background: "rgba(255,255,255,0.02)",
        padding: "10px 12px",
        minWidth: 0,
      }}
    >
      <p className="pf-meta-row" style={{ margin: 0, fontSize: 10, opacity: 0.65, fontWeight: 600 }}>
        {label}
      </p>
      <p style={{ margin: "4px 0 0", fontSize: 16, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{value}</p>
    </div>
  );
}

export function OutcomesLearningPanel({ data }: Props) {
  const avg =
    data.average_claim_confirmation_minutes == null
      ? "—"
      : `${data.average_claim_confirmation_minutes} min`;

  return (
    <SectionCard eyebrow="PulseFill insight" title="What PulseFill is learning" style={{ minWidth: 0 }}>
      <div style={{ display: "grid", gap: 14 }}>
        <div
          style={{
            borderRadius: "var(--pf-radius-md)",
            border: "1px solid rgba(245,247,250,0.12)",
            background: "rgba(99,102,241,0.06)",
            padding: "14px 16px",
            display: "grid",
            gap: 8,
          }}
        >
          <p style={{ margin: 0, fontSize: 14, fontWeight: 650, color: "rgba(245,247,250,0.92)" }}>
            {data.suggested_focus.headline}
          </p>
          <p className="pf-muted-copy" style={{ margin: 0, fontSize: 13, lineHeight: 1.5 }}>
            {data.suggested_focus.detail}
          </p>
          <div>
            <MotionAction>
              <Link href={data.suggested_focus.href} style={actionLinkStyle("primary")}>
                Open next step
              </Link>
            </MotionAction>
          </div>
        </div>

        <p className="pf-muted-copy" style={{ margin: 0, fontSize: 11, opacity: 0.72 }}>
          {data.period.label} · rolling window ends now
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
            gap: 10,
          }}
        >
          <Metric label="Recovered" value={String(data.recovered_count_30d)} />
          <Metric label="Missed" value={String(data.missed_count_30d)} />
          <Metric label="No-match runs" value={String(data.no_match_count_30d)} />
          <Metric label="Delivery failures" value={String(data.delivery_failure_count_30d)} />
          <Metric label="Avg confirm time" value={avg} />
        </div>

        {data.top_no_match_reasons.length > 0 ? (
          <div style={{ display: "grid", gap: 8 }}>
            <p className="pf-kicker" style={{ margin: 0, fontSize: 10 }}>
              Top no-match patterns
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {data.top_no_match_reasons.slice(0, 4).map((r) => (
                <div
                  key={r.reason}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                    fontSize: 13,
                    color: "rgba(245,247,250,0.78)",
                  }}
                >
                  <span style={{ minWidth: 0 }}>{r.label}</span>
                  <span className="pf-meta-row" style={{ fontVariantNumeric: "tabular-nums", flexShrink: 0 }}>
                    {r.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {data.thin_services.length > 0 ? (
          <div style={{ display: "grid", gap: 8 }}>
            <p className="pf-kicker" style={{ margin: 0, fontSize: 10 }}>
              Services with repeated no-matches
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {data.thin_services.slice(0, 3).map((s) => (
                <div
                  key={s.service_id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                    fontSize: 13,
                    color: "rgba(245,247,250,0.78)",
                  }}
                >
                  <span style={{ minWidth: 0 }}>
                    {isDrilldownServiceId(s.service_id) ? (
                      <MotionAction>
                        <Link
                          href={`/services/coverage/${s.service_id}`}
                          style={{
                            ...actionLinkStyle("secondary"),
                            fontSize: 13,
                            fontWeight: 600,
                          }}
                        >
                          {s.service_name}
                        </Link>
                      </MotionAction>
                    ) : (
                      s.service_name
                    )}
                  </span>
                  <span className="pf-meta-row" style={{ fontVariantNumeric: "tabular-nums", flexShrink: 0 }}>
                    {s.no_match_count} no-match · {s.recovered_bookings_30d} recovered
                  </span>
                </div>
              ))}
            </div>
            <MotionAction>
              <Link href="/services" style={actionLinkStyle("secondary")}>
                Review services
              </Link>
            </MotionAction>
          </div>
        ) : null}
      </div>
    </SectionCard>
  );
}
