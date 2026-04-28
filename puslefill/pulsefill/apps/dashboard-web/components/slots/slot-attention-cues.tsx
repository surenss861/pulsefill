"use client";

import type { OpenSlotDetail } from "@/types/open-slot-detail";
import type { NotificationLogRow } from "@/types/notification-log";

type Props = {
  slot: OpenSlotDetail;
  logs: NotificationLogRow[];
};

export function SlotAttentionCues({ slot, logs }: Props) {
  const cues: string[] = [];

  const offerFailed = slot.slot_offers.filter((o) => o.status.toLowerCase() === "failed").length;
  if (offerFailed > 0) {
    cues.push(`${offerFailed} offer${offerFailed === 1 ? "" : "s"} had a delivery issue — review the Offers section.`);
  }

  const logFailed = logs.filter((l) => l.status.toLowerCase() === "failed").length;
  if (logFailed > 0) {
    cues.push(`${logFailed} notification entr${logFailed === 1 ? "y" : "ies"} needs review — check message details below.`);
  }

  const queuedSkipped = logs.filter((l) => l.status === "skipped_no_queue").length;
  if (queuedSkipped > 0 && slot.slot_offers.length > 0) {
    cues.push(
      `${queuedSkipped} notification${queuedSkipped === 1 ? "" : "s"} skipped queue (worker/Redis) — offers may not have reached customers.`,
    );
  }

  if (cues.length === 0) return null;

  return (
    <div
      style={{
        borderRadius: 16,
        border: "1px solid rgba(251,191,36,0.35)",
        background: "rgba(251,191,36,0.07)",
        padding: "14px 16px",
        color: "var(--text)",
      }}
    >
      <p style={{ margin: 0, fontSize: 11, fontWeight: 650, letterSpacing: "0.06em", color: "rgba(251,191,36,0.95)" }}>
        NEEDS ATTENTION
      </p>
      <ul style={{ margin: "10px 0 0", paddingLeft: 18, fontSize: 13, lineHeight: 1.55, color: "var(--muted)" }}>
        {cues.map((c) => (
          <li key={c} style={{ marginBottom: 4 }}>
            <span style={{ color: "var(--text)" }}>{c}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
