"use client";

import Link from "next/link";
import { useOperatorActivityFeed } from "@/hooks/useOperatorActivityFeed";
import { OperatorErrorState } from "@/components/operator/operator-error-state";
import { OperatorLoadingState } from "@/components/operator/operator-loading-state";
import type { OperatorActivityItem, OperatorActivityKind } from "@/types/operator-activity-feed";

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

function formatSlotWhen(iso: string | undefined): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    const now = new Date();
    const sameDay =
      d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
    const time = d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
    if (sameDay) return `Today ${time}`;
    return d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  } catch {
    return "";
  }
}

function activityKindKicker(kind: OperatorActivityKind): string {
  switch (kind) {
    case "offers_sent":
      return "Offers sent";
    case "offers_retry_sent":
      return "Offers retried";
    case "delivery_failed":
      return "Delivery issue";
    case "offers_no_match":
      return "No match yet";
    case "claim_received":
      return "Claim received";
    case "booking_confirmed":
      return "Booking confirmed";
    case "slot_expired":
      return "Opening expired";
    case "slot_cancelled":
      return "Opening updated";
    case "internal_note_updated":
      return "Internal note";
    case "recovery_feedback_added":
      return "Recovery feedback";
    default:
      return "Activity";
  }
}

function activitySubjectLine(item: OperatorActivityItem): string {
  const label = item.service_name?.trim() || item.business_name?.trim() || item.title?.trim() || "Workspace event";
  const when = item.starts_at ? formatSlotWhen(item.starts_at) : formatFeedTime(item.occurred_at);
  if (when) return `${label} · ${when}`;
  return label;
}

function activityStatusLine(item: OperatorActivityItem): string | null {
  const d = item.detail?.trim();
  if (d) return d;
  const p = item.priority_summary?.trim();
  if (p) return p;
  const r = item.recovery_recommendation_title?.trim();
  if (r) return r;
  return null;
}

export function CommandCenterRecentActivity() {
  const { items, loading, error } = useOperatorActivityFeed(120_000);
  const top = items.slice(0, 3);
  return (
    <section className="pf-command-feed">
      <div className="pf-command-feed__head">
        <div>
          <h2 className="pf-section-title">See what happened</h2>
          <p className="pf-muted-copy pf-command-feed__lede">
            Openings, offers, claims, and confirmations appear here.
          </p>
        </div>
        <Link href="/activity" className="pf-command-feed__all">
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
            <p className="pf-section-title pf-activity-empty-timeline__title">No activity yet</p>
            <p className="pf-muted-copy pf-activity-empty-timeline__detail">
              Openings, offers, claims, and confirmations appear here.
            </p>
          </div>
        </div>
      ) : null}

      {!loading && !error && top.length > 0 ? (
        <ul className="pf-command-feed__list pf-command-feed__list--casefile">
          {top.map((item) => {
            const kicker = activityKindKicker(item.kind);
            const subject = activitySubjectLine(item);
            const status = activityStatusLine(item);
            return (
              <li key={item.id} className="pf-command-feed__row pf-activity-case-row">
                <p className="pf-activity-case-row__kicker">{kicker}</p>
                <p className="pf-activity-case-row__subject">{subject}</p>
                {status ? <p className="pf-activity-case-row__status pf-muted-copy">{status}</p> : null}
              </li>
            );
          })}
        </ul>
      ) : null}
    </section>
  );
}
