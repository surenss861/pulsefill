"use client";

import Link from "next/link";
import { useState } from "react";
import { MotionAction, MotionTapSurface } from "@/components/operator/operator-motion-primitives";
import { OperatorRow, OperatorRowList } from "@/components/operator/operator-row-list";
import { OperatorStatusChip } from "@/components/operator/operator-status-chip";
import { actionLinkStyle } from "@/lib/operator-action-link-styles";
import { apiFetch } from "@/lib/api";
import { operatorSurfaceShell } from "@/lib/operator-surface-styles";
import type { CustomerFollowUpQueueItem } from "@/types/action-queue";

type Props = {
  items: CustomerFollowUpQueueItem[];
  onChanged: () => void;
};

function relativeDue(iso: string): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "Due";
  const now = Date.now();
  const diffMin = Math.round((t - now) / 60_000);
  if (diffMin <= -60) return `${Math.round(-diffMin / 60)}h overdue`;
  if (diffMin < 0) return `${-diffMin}m overdue`;
  if (diffMin < 60) return "Due soon";
  if (diffMin < 24 * 60) return `Due in ${Math.round(diffMin / 60)}h`;
  return `Due ${new Date(iso).toLocaleString()}`;
}

export function ActionQueueCustomerFollowUps({ items, onChanged }: Props) {
  const [busy, setBusy] = useState<string | null>(null);

  if (items.length === 0) return null;

  async function markComplete(it: CustomerFollowUpQueueItem) {
    setBusy(it.note_id);
    try {
      await apiFetch(
        `/v1/businesses/mine/customers/${it.customer_id}/notes/${it.note_id}/complete-follow-up`,
        { method: "POST" },
      );
      onChanged();
    } finally {
      setBusy(null);
    }
  }

  return (
    <section style={{ padding: 16, ...operatorSurfaceShell("operational"), borderColor: "rgba(255, 122, 24, 0.22)" }}>
      <p className="pf-kicker" style={{ margin: 0, fontSize: 10 }}>
        Customer follow-ups
      </p>
      <h2 className="pf-section-title" style={{ fontSize: 16, margin: "6px 0 0" }}>
        Due internal reminders
      </h2>
      <p className="pf-muted-copy" style={{ margin: "8px 0 14px", fontSize: 12, lineHeight: 1.5 }}>
        From workspace notes with a follow-up time that has arrived. Only staff can see these.
      </p>
      <OperatorRowList density="compact">
        {items.map((it) => (
          <OperatorRow
            key={it.note_id}
            title={`Follow up with ${it.customer_label}`}
            meta={
              <>
                <span style={{ fontSize: 12, color: "rgba(245,247,250,0.78)" }}>{it.note_preview}</span>
                <span style={{ display: "block", marginTop: 4, fontSize: 11, color: "var(--muted)" }}>
                  Note by {it.created_by_name} · {relativeDue(it.follow_up_at)}
                </span>
              </>
            }
            status={<OperatorStatusChip kind="attention" label="Due" caps />}
            action={
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "flex-end" }}>
                <MotionAction>
                  <Link href={`/customers/${it.customer_id}`} style={actionLinkStyle("primary")}>
                    View customer
                  </Link>
                </MotionAction>
                <MotionTapSurface disabled={busy === it.note_id}>
                  <button
                    type="button"
                    disabled={busy === it.note_id}
                    onClick={() => void markComplete(it)}
                    style={{
                      borderRadius: 8,
                      border: "1px solid rgba(255,255,255,0.14)",
                      background: "rgba(255,255,255,0.06)",
                      color: "var(--text)",
                      padding: "6px 10px",
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: busy === it.note_id ? "wait" : "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    {busy === it.note_id ? "…" : "Mark complete"}
                  </button>
                </MotionTapSurface>
              </div>
            }
          />
        ))}
      </OperatorRowList>
    </section>
  );
}
