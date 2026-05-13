"use client";

import Link from "next/link";
import { useMemo, useState, type CSSProperties } from "react";
import { actionLinkStyle } from "@/lib/operator-action-link-styles";
import { operatorSurfaceShell } from "@/lib/operator-surface-styles";
import type { StandbyCoveragePayload } from "@/hooks/useStandbyCoverage";

type Props = {
  data: StandbyCoveragePayload | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
};

export function StandbyCoveragePanel({ data, loading, error, onRetry }: Props) {
  const [serviceFilter, setServiceFilter] = useState<string>("");

  const filteredServices = useMemo(() => {
    if (!data) return [];
    if (!serviceFilter) return data.services;
    return data.services.filter((s) => s.service_id === serviceFilter);
  }, [data, serviceFilter]);

  return (
    <div
      style={{
        padding: "14px 16px",
        ...operatorSurfaceShell("quiet"),
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      <div>
        <p className="pf-eyebrow-plain" style={{ margin: 0 }}>
          Waiting list
        </p>
        <h2 style={{ margin: "6px 0 0", fontSize: 15, fontWeight: 650, letterSpacing: "-0.02em" }}>Coverage</h2>
        <p style={{ margin: "8px 0 0", color: "rgba(245,247,250,0.5)", fontSize: 12, lineHeight: 1.55 }}>
          Who can receive offers after they join and pick how they want to hear from you.
        </p>
      </div>

      {loading ? (
        <p className="pf-muted-copy" style={{ margin: 0, fontSize: 12 }}>
          Loading coverage…
        </p>
      ) : null}

      {error ? (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
          <p style={{ margin: 0, fontSize: 12, color: "#f87171" }}>{error}</p>
          <button
            type="button"
            onClick={() => onRetry()}
            style={{
              borderRadius: 8,
              border: "1px solid rgba(255,255,255,0.14)",
              background: "rgba(255,255,255,0.06)",
              color: "var(--text)",
              padding: "4px 10px",
              fontSize: 11,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Retry
          </button>
        </div>
      ) : null}

      {!loading && !error && data ? (
        <>
          <div
            style={{
              margin: 0,
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "8px 12px",
              fontSize: 12,
            }}
          >
            <Stat label="Active preferences" value={String(data.active_preferences_count)} />
            <Stat label="Customers (any pref)" value={String(data.standby_customer_count)} />
            <Stat label="In pool (membership)" value={String(data.eligible_customer_count)} hint="Ready to match" />
            <Stat label="Reachable" value={String(data.reachable_customer_count)} hint="Push / SMS / email" />
            {data.customers_pending_membership > 0 ? (
              <Stat
                label="Pending membership"
                value={String(data.customers_pending_membership)}
                hint="Prefs only — finish join"
                fullWidth
              />
            ) : null}
            {data.unreachable_eligible_count > 0 ? (
              <Stat
                label="In pool, not reachable"
                value={String(data.unreachable_eligible_count)}
                hint="May miss offers"
                fullWidth
              />
            ) : null}
          </div>

          {data.services.length > 0 ? (
            <div style={{ display: "grid", gap: 8 }}>
              <label style={{ display: "grid", gap: 4, fontSize: 11 }}>
                <span className="pf-muted-copy" style={{ textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  Filter by service
                </span>
                <select
                  value={serviceFilter}
                  onChange={(e) => setServiceFilter(e.target.value)}
                  style={selectStyle}
                >
                  <option value="">All services</option>
                  {data.services.map((s) => (
                    <option key={s.service_id} value={s.service_id}>
                      {s.service_name} ({s.watching_customer_count})
                    </option>
                  ))}
                </select>
              </label>

              <p className="pf-muted-copy" style={{ margin: 0, fontSize: 11, lineHeight: 1.45, color: "rgba(245,247,250,0.48)" }}>
                Customers with flexible service preferences count toward every service.
              </p>

              <div
                style={{
                  borderRadius: 10,
                  border: "1px solid rgba(255,255,255,0.08)",
                  overflow: "hidden",
                  maxHeight: 200,
                  overflowY: "auto",
                }}
              >
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                  <thead>
                    <tr style={{ background: "rgba(255,255,255,0.04)", color: "rgba(245,247,250,0.45)" }}>
                      <th style={th}>Service</th>
                      <th style={{ ...th, textAlign: "right", width: 72 }}>Watching</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredServices.map((s) => (
                      <tr key={s.service_id}>
                        <td style={td}>{s.service_name}</td>
                        <td
                          style={{
                            ...td,
                            textAlign: "right",
                            fontVariantNumeric: "tabular-nums",
                            color:
                              s.watching_customer_count === 0
                                ? "rgba(248,113,113,0.95)"
                                : s.watching_customer_count === 1
                                  ? "rgba(251,191,36,0.95)"
                                  : "rgba(245,247,250,0.88)",
                          }}
                        >
                          {s.watching_customer_count}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {data.uncovered_services.length > 0 ? (
                <p style={{ margin: 0, fontSize: 11, lineHeight: 1.45, color: "rgba(248,113,113,0.85)" }}>
                  No eligible customers are watching:{" "}
                  {data.uncovered_services.map((s) => s.service_name).join(", ")}.
                </p>
              ) : null}
              {data.thin_services.length > 0 ? (
                <p style={{ margin: 0, fontSize: 11, lineHeight: 1.45, color: "rgba(251,191,36,0.88)" }}>
                  Thin coverage (one customer): {data.thin_services.map((s) => s.service_name).join(", ")}.
                </p>
              ) : null}
            </div>
          ) : (
            <p className="pf-muted-copy" style={{ margin: 0, fontSize: 12 }}>
              Add services to see per-service standby coverage.
            </p>
          )}

          {data.recent_activity.length > 0 ? (
            <div style={{ display: "grid", gap: 6 }}>
              <p className="pf-muted-copy" style={{ margin: 0, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                Recent standby activity
              </p>
              <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 6 }}>
                {data.recent_activity.map((row, i) => (
                  <li
                    key={`${row.updated_at}-${i}`}
                    style={{
                      fontSize: 11,
                      lineHeight: 1.45,
                      padding: "6px 8px",
                      borderRadius: 8,
                      background: "rgba(0,0,0,0.18)",
                      border: "1px solid rgba(255,255,255,0.06)",
                    }}
                  >
                    <span style={{ color: "rgba(245,247,250,0.88)", fontWeight: 600 }}>{row.customer_display}</span>
                    {!row.active ? (
                      <span style={{ marginLeft: 6, color: "rgba(245,247,250,0.45)" }}>· paused</span>
                    ) : null}
                    <span style={{ display: "block", color: "rgba(245,247,250,0.48)", marginTop: 2 }}>
                      {row.service_label} · {row.location_label}
                    </span>
                    <span style={{ display: "block", color: "rgba(245,247,250,0.38)", marginTop: 2, fontSize: 10 }}>
                      {new Date(row.updated_at).toLocaleString()}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <p style={{ margin: 0, fontSize: 11 }}>
            <Link href="/customers#invite-customer" style={{ ...actionLinkStyle("ghost"), fontWeight: 600 }}>
              Invite customers
            </Link>
            <span style={{ color: "var(--muted)" }}> · </span>
            <Link href="/overview" style={{ ...actionLinkStyle("ghost"), fontWeight: 600 }}>
              Recovery Health
            </Link>
            <span style={{ color: "var(--muted)" }}> · </span>
            <Link href="/open-slots?status=open" style={{ ...actionLinkStyle("ghost"), fontWeight: 600 }}>
              Openings
            </Link>
          </p>
        </>
      ) : null}
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
  fullWidth,
}: {
  label: string;
  value: string;
  hint?: string;
  fullWidth?: boolean;
}) {
  return (
    <div style={{ gridColumn: fullWidth ? "1 / -1" : undefined }}>
      <p className="pf-muted-copy" style={{ margin: 0, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.03em" }}>
        {label}
      </p>
      <p style={{ margin: "2px 0 0", fontSize: 14, fontWeight: 700, color: "var(--pf-text-primary)" }}>{value}</p>
      {hint ? (
        <p className="pf-muted-copy" style={{ margin: "2px 0 0", fontSize: 10 }}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}

const selectStyle: CSSProperties = {
  borderRadius: 8,
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(0,0,0,0.2)",
  color: "var(--text)",
  padding: "6px 8px",
  fontSize: 12,
  fontFamily: "inherit",
};

const th: CSSProperties = {
  textAlign: "left",
  padding: "6px 8px",
  fontWeight: 600,
  fontSize: 10,
};

const td: CSSProperties = {
  padding: "6px 8px",
  borderTop: "1px solid rgba(255,255,255,0.06)",
};
