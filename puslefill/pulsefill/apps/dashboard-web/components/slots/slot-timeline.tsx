"use client";

import type { CSSProperties } from "react";
import { useMemo } from "react";
import { formatRelativeTime } from "@/lib/format-relative-time";
import {
  formatActorLine,
  isTimelineMilestone,
  isTimelineNoise,
  labelForTimelineEvent,
  sortTimelineForStory,
  summarizeTimelineMetadata,
} from "@/lib/timeline-presenters";
import type { SlotTimelineEvent } from "@/types/timeline";

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-CA", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

const panel: CSSProperties = {
  borderRadius: 24,
  border: "1px solid rgba(255,255,255,0.1)",
  background: "var(--surface)",
  padding: 20,
};

export function SlotTimeline({ events }: { events: SlotTimelineEvent[] }) {
  const sorted = useMemo(() => sortTimelineForStory(events), [events]);

  const latestMilestone = useMemo(() => {
    for (const e of sorted) {
      if (isTimelineMilestone(e.event_type)) return e;
    }
    return sorted[0] ?? null;
  }, [sorted]);

  return (
    <div style={panel}>
      <h2 style={{ margin: 0, fontSize: 18 }}>Timeline</h2>
      <p style={{ margin: "8px 0 0", fontSize: 14, color: "var(--muted)" }}>
        What changed on this slot, newest first. Major milestones are emphasized; routine notifications are de-emphasized.
      </p>

      {events.length === 0 ? (
        <div
          style={{
            marginTop: 16,
            borderRadius: 16,
            border: "1px dashed rgba(255,255,255,0.12)",
            padding: 16,
            background: "rgba(0,0,0,0.15)",
          }}
        >
          <p style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>No audit events yet</p>
          <p style={{ margin: "8px 0 0", fontSize: 13, color: "var(--muted)", lineHeight: 1.5 }}>
            Events appear when the slot is created, offers go out, claims resolve, or status changes.
          </p>
        </div>
      ) : (
        <>
          {latestMilestone ? (
            <div
              style={{
                marginTop: 16,
                borderRadius: 16,
                border: "1px solid rgba(77,226,197,0.35)",
                background: "rgba(77,226,197,0.08)",
                padding: "14px 16px",
              }}
            >
              <p style={{ margin: 0, fontSize: 11, fontWeight: 650, letterSpacing: "0.06em", color: "var(--primary)" }}>
                LATEST MILESTONE
              </p>
              <p style={{ margin: "8px 0 0", fontSize: 16, fontWeight: 650 }}>{labelForTimelineEvent(latestMilestone.event_type)}</p>
              <p style={{ margin: "6px 0 0", fontSize: 13, color: "var(--muted)" }}>
                {formatDate(latestMilestone.created_at)} · {formatRelativeTime(latestMilestone.created_at)}
              </p>
            </div>
          ) : null}

          <ul style={{ margin: "16px 0 0", padding: 0, listStyle: "none" }}>
            {sorted.map((event) => {
              const milestone = isTimelineMilestone(event.event_type);
              const noise = isTimelineNoise(event.event_type);
              const metaLine = summarizeTimelineMetadata(event.event_type, event.metadata);

              return (
                <li
                  key={event.id}
                  style={{
                    borderBottom: "1px solid rgba(255,255,255,0.06)",
                    paddingBottom: 14,
                    marginBottom: 14,
                    opacity: noise ? 0.72 : 1,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                    <div style={{ flex: "1 1 200px", minWidth: 0 }}>
                      <p
                        style={{
                          margin: 0,
                          fontSize: noise ? 13 : 15,
                          fontWeight: milestone ? 650 : 500,
                          color: "var(--text)",
                        }}
                      >
                        {labelForTimelineEvent(event.event_type)}
                      </p>
                      <p style={{ margin: "6px 0 0", fontSize: 12, color: "var(--muted)" }}>
                        {formatDate(event.created_at)} · {formatRelativeTime(event.created_at)}
                      </p>
                      <p style={{ margin: "4px 0 0", fontSize: 11, color: "var(--muted)" }}>
                        {formatActorLine(event.actor_type, event.actor_id, event.actor_label)}
                      </p>
                      {metaLine ? (
                        <p style={{ margin: "8px 0 0", fontSize: 13, color: "rgba(255,255,255,0.82)" }}>{metaLine}</p>
                      ) : null}
                    </div>
                  </div>

                  {event.metadata && Object.keys(event.metadata).length > 0 && !metaLine ? (
                    <details style={{ marginTop: 10 }}>
                      <summary style={{ cursor: "pointer", fontSize: 12, color: "var(--muted)" }}>
                        Technical details
                      </summary>
                      <pre
                        style={{
                          marginTop: 8,
                          padding: 10,
                          borderRadius: 12,
                          fontSize: 11,
                          overflow: "auto",
                          background: "rgba(0,0,0,0.25)",
                          border: "1px solid rgba(255,255,255,0.08)",
                          color: "var(--muted)",
                        }}
                      >
                        {JSON.stringify(event.metadata, null, 2)}
                      </pre>
                    </details>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
