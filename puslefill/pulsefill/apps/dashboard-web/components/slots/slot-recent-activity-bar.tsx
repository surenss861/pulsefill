"use client";

import { useMemo } from "react";
import { formatRelativeTime } from "@/lib/format-relative-time";
import { labelForTimelineEvent, pickLatestMilestone } from "@/lib/timeline-presenters";
import type { OpenSlotDetail } from "@/types/open-slot-detail";

function lastTouchedSummary(slot: OpenSlotDetail): string | null {
  const at = slot.last_touched_at;
  if (!at) return null;
  const who =
    slot.last_touched_by?.full_name?.trim() ||
    slot.last_touched_by?.email?.split("@")[0]?.trim() ||
    (slot.last_touched_by_staff_id ? `Staff ${String(slot.last_touched_by_staff_id).slice(0, 8)}…` : null);
  if (!who) return `Last touched ${formatRelativeTime(at)}`;
  return `Last touched by ${who} (${formatRelativeTime(at)})`;
}
import type { NotificationLogRow } from "@/types/notification-log";
import type { SlotTimelineEvent } from "@/types/timeline";

type Props = {
  slot: OpenSlotDetail;
  timelineEvents: SlotTimelineEvent[];
  notificationLogs: NotificationLogRow[];
  refreshedAt: Date | null;
};

export function SlotRecentActivityBar({ slot, timelineEvents, notificationLogs, refreshedAt }: Props) {
  const line = useMemo(() => {
    const parts: string[] = [];

    if (refreshedAt) {
      parts.push(`Dashboard data ${formatRelativeTime(refreshedAt.toISOString())}`);
    }

    const touch = lastTouchedSummary(slot);
    if (touch) {
      parts.push(touch);
    }

    if (slot.last_offer_batch_at) {
      parts.push(`Offers batch ${formatRelativeTime(slot.last_offer_batch_at)}`);
    }

    const latest = pickLatestMilestone(timelineEvents);
    if (latest) {
      parts.push(
        `Last milestone · ${labelForTimelineEvent(latest.event_type)} (${formatRelativeTime(latest.created_at)})`,
      );
    }

    const lastFail = notificationLogs
      .filter((l) => (l.status ?? "").toLowerCase() === "failed")
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
    if (lastFail) {
      parts.push(`Last delivery issue ${formatRelativeTime(lastFail.created_at)} — check notification logs`);
    }

    if (slot.status === "claimed" && slot.winning_claim) {
      parts.push("Awaiting staff confirmation");
    }

    return parts;
  }, [slot, timelineEvents, notificationLogs, refreshedAt]);

  if (line.length === 0) return null;

  return (
    <div
      style={{
        marginTop: 4,
        padding: "10px 14px",
        borderRadius: 14,
        border: "1px solid rgba(255,255,255,0.08)",
        background: "rgba(0,0,0,0.18)",
        fontSize: 12,
        lineHeight: 1.55,
        color: "var(--muted)",
      }}
    >
      {line.map((p, i) => (
        <span key={p}>
          {i > 0 ? <span style={{ color: "rgba(255,255,255,0.2)" }}> · </span> : null}
          <span style={{ color: "var(--text)" }}>{p}</span>
        </span>
      ))}
    </div>
  );
}
