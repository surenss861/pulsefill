"use client";

import Link from "next/link";
import { useOperatorActivityFeed } from "@/hooks/useOperatorActivityFeed";
import { OperatorErrorState } from "@/components/operator/operator-error-state";
import { OperatorLoadingState } from "@/components/operator/operator-loading-state";

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

      {error ? (
        <div style={{ marginTop: 12 }}>
          <OperatorErrorState rawMessage={error} compact />
        </div>
      ) : null}
      {loading && !error ? (
        <div style={{ marginTop: 10 }}>
          <OperatorLoadingState variant="inline" skeleton="none" title="Loading recent events…" />
        </div>
      ) : null}

      {!loading && !error && top.length === 0 ? (
        <div className="pf-activity-empty-timeline" style={{ marginTop: 12 }}>
          <div className="pf-activity-empty-timeline__spine" aria-hidden style={{ minHeight: 72 }} />
          <div className="pf-activity-empty-timeline__body">
            <p className="pf-section-title" style={{ fontSize: 14, margin: 0 }}>
              No events yet
            </p>
            <p className="pf-muted-copy" style={{ margin: "6px 0 0", fontSize: 13 }}>
              Openings, offers, and confirmations will show here as recovery moves forward.
            </p>
          </div>
        </div>
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
