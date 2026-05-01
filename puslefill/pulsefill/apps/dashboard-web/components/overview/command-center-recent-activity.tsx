"use client";

import Link from "next/link";
import { useOperatorActivityFeed } from "@/hooks/useOperatorActivityFeed";
import { activityFeedErrorUi } from "@/lib/operator-activity-feed-errors";
import { actionLinkStyle } from "@/lib/operator-action-link-styles";

function formatFeedTime(iso: string | undefined): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  } catch {
    return "";
  }
}

export function CommandCenterRecentActivity() {
  const { items, loading, error } = useOperatorActivityFeed(120_000);
  const top = items.slice(0, 3);
  const errorUi = error ? activityFeedErrorUi(error) : null;

  return (
    <section className="pf-command-feed">
      <div className="pf-command-feed__head">
        <div>
          <h2 className="pf-section-title">Recent activity</h2>
          <p className="pf-muted-copy" style={{ margin: "6px 0 0", maxWidth: 520 }}>
            Latest events from openings, offers, claims, and notifications.
          </p>
        </div>
        <Link href="/activity" style={{ fontSize: 12, fontWeight: 600, color: "var(--pf-accent-primary)", textDecoration: "none" }}>
          View all →
        </Link>
      </div>

      {errorUi ? (
        <div
          style={{
            marginTop: 12,
            padding: "12px 14px",
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.08)",
            background: "rgba(0,0,0,0.2)",
          }}
        >
          <p style={{ margin: 0, fontSize: 13, fontWeight: 650, color: "var(--pf-text-primary)" }}>{errorUi.title}</p>
          <p className="pf-muted-copy" style={{ margin: "6px 0 0", fontSize: 13 }}>
            {errorUi.description}
          </p>
          {errorUi.suggestSignIn ? (
            <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
              <Link href="/sign-in" style={actionLinkStyle("primary")}>
                Sign in
              </Link>
              <span className="pf-meta-row" style={{ letterSpacing: "0.04em" }}>or refresh this page</span>
            </div>
          ) : null}
        </div>
      ) : null}
      {loading && !error ? <p className="pf-muted-copy" style={{ marginTop: 12, marginBottom: 0 }}>Loading…</p> : null}

      {!loading && !error && top.length === 0 ? (
        <p className="pf-muted-copy" style={{ marginTop: 12, marginBottom: 0 }}>
          No events yet.
        </p>
      ) : null}

      {!loading && !error && top.length > 0 ? (
        <ul className="pf-command-feed__list">
          {top.map((item) => {
            const ts = formatFeedTime(item.occurred_at);
            return (
              <li key={item.id} className="pf-command-feed__row">
                <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "var(--pf-text-primary)" }}>{item.title}</p>
                {ts ? <p className="pf-meta-row" style={{ margin: "4px 0 0" }}>{ts}</p> : null}
                {item.detail ? (
                  <p className="pf-muted-copy" style={{ margin: "6px 0 0", fontSize: 12, lineHeight: 1.45 }}>
                    {item.detail}
                  </p>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : null}
    </section>
  );
}
