"use client";

import type { CSSProperties } from "react";
import { useMemo } from "react";
import { displayCustomer } from "@/lib/customer-ref";
import {
  notificationLogHeadline,
  notificationLogSortKey,
  notificationLogTone,
  presentNotificationDeliveryMode,
  presentNotificationReason,
} from "@/lib/notification-log-presenters";
import type { NotificationLogRow } from "@/types/notification-log";

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

function toneStyle(tone: ReturnType<typeof notificationLogTone>): CSSProperties {
  switch (tone) {
    case "good":
      return {
        border: "1px solid rgba(52,211,153,0.28)",
        background: "rgba(16,185,129,0.06)",
      };
    case "bad":
      return {
        border: "1px solid rgba(248,113,113,0.35)",
        background: "rgba(239,68,68,0.08)",
      };
    case "warn":
      return {
        border: "1px solid rgba(251,191,36,0.35)",
        background: "rgba(251,191,36,0.06)",
      };
    default:
      return {
        border: "1px solid rgba(255,255,255,0.1)",
        background: "rgba(0,0,0,0.2)",
      };
  }
}

function toneGlyph(tone: ReturnType<typeof notificationLogTone>): string {
  if (tone === "good") return "✓";
  if (tone === "bad") return "!";
  if (tone === "warn") return "⚠";
  return "·";
}

export function NotificationLogsInspector({ logs }: { logs: NotificationLogRow[] }) {
  const sorted = useMemo(() => {
    return [...logs].sort((a, b) => {
      const ka = notificationLogSortKey(a);
      const kb = notificationLogSortKey(b);
      if (ka !== kb) return ka - kb;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [logs]);

  const summary = useMemo(() => {
    let failed = 0;
    let delivered = 0;
    let warn = 0;
    for (const l of logs) {
      const s = (l.status ?? "").toLowerCase();
      if (s === "failed") failed++;
      else if (s === "delivered") delivered++;
      else if (s === "skipped_no_queue") warn++;
    }
    return { failed, delivered, warn, total: logs.length };
  }, [logs]);

  return (
    <div style={panel}>
      <h2 style={{ margin: 0, fontSize: 18 }}>Notification history</h2>
      <p style={{ margin: "8px 0 0", fontSize: 14, color: "var(--muted)" }}>
        Customer message history for this opening. Items that need review are listed first.
      </p>

      {logs.length === 0 ? (
        <div
          style={{
            marginTop: 16,
            borderRadius: 16,
            border: "1px dashed rgba(255,255,255,0.12)",
            padding: 16,
            background: "rgba(0,0,0,0.15)",
          }}
        >
          <p style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>No notification history yet</p>
          <p style={{ margin: "8px 0 0", fontSize: 13, color: "var(--muted)", lineHeight: 1.5 }}>
            After you send offers, the worker records attempts here. If this stays empty, check that notifications ran and
            Redis/worker are healthy.
          </p>
        </div>
      ) : (
        <>
          <div
            style={{
              marginTop: 14,
              display: "flex",
              flexWrap: "wrap",
              gap: 10,
              fontSize: 12,
              color: "var(--muted)",
            }}
          >
            <span>
              <strong style={{ color: "var(--text)" }}>{summary.total}</strong> attempts
            </span>
            <span>·</span>
            <span style={{ color: "#6ee7b7" }}>{summary.delivered} delivered</span>
            {summary.failed > 0 ? (
              <>
                <span>·</span>
                <span style={{ color: "#fecaca" }}>{summary.failed} failed</span>
              </>
            ) : null}
            {summary.warn > 0 ? (
              <>
                <span>·</span>
                <span style={{ color: "#fcd34d" }}>{summary.warn} skipped queue</span>
              </>
            ) : null}
          </div>

          <div style={{ marginTop: 16, display: "grid", gap: 12 }}>
            {sorted.map((log) => {
              const tone = notificationLogTone(log);
              const headline = notificationLogHeadline(log);
              const reason = presentNotificationReason(log);
              const mode = presentNotificationDeliveryMode(log);
              const secondary =
                mode && !headline.toLowerCase().includes(mode.toLowerCase())
                  ? `Mode: ${mode}`
                  : reason && !headline.includes(reason)
                    ? reason
                    : null;

              return (
                <div
                  key={log.id}
                  style={{
                    borderRadius: 16,
                    padding: 14,
                    ...toneStyle(tone),
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                    <div style={{ display: "flex", gap: 10, alignItems: "flex-start", minWidth: 0 }}>
                      <span
                        aria-hidden
                        style={{
                          fontSize: 14,
                          lineHeight: 1.4,
                          opacity: tone === "bad" ? 1 : 0.85,
                          flexShrink: 0,
                        }}
                      >
                        {toneGlyph(tone)}
                      </span>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: 15, fontWeight: 650, color: "var(--text)", lineHeight: 1.35 }}>
                          {headline}
                        </p>
                        {secondary ? (
                          <p style={{ margin: "6px 0 0", fontSize: 12, color: "var(--muted)" }}>{secondary}</p>
                        ) : null}
                        <p style={{ margin: "8px 0 0", fontSize: 12, color: "var(--muted)" }}>{formatDate(log.created_at)}</p>
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      marginTop: 12,
                      display: "grid",
                      gap: 6,
                      gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                      fontSize: 12,
                    }}
                  >
                    <div>
                      <span style={{ color: "var(--muted)" }}>Customer · </span>
                      <span style={{ fontSize: 13 }}>{displayCustomer(log.customer_id)}</span>
                    </div>
                    <div>
                      <span style={{ color: "var(--muted)" }}>Status · </span>
                      <span style={{ fontWeight: 600 }}>{log.status}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
