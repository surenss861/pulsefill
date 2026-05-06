"use client";

import { useMemo, useState } from "react";
import { OperatorLoadingState } from "@/components/operator/operator-loading-state";
import { OperatorErrorState } from "@/components/operator/operator-error-state";
import { OperatorRow, OperatorRowList } from "@/components/operator/operator-row-list";
import { OperatorStatusChip } from "@/components/operator/operator-status-chip";
import type { OperatorStatusKind } from "@/components/operator/operator-status-chip";
import { MotionTapSurface } from "@/components/operator/operator-motion-primitives";
import { operatorSurfaceShell } from "@/lib/operator-surface-styles";
import type { CustomerTimelineItem, CustomerTimelineSeverity } from "@/types/customer-timeline";
import type { CustomerNoteItem } from "@/hooks/useCustomerNotes";

type Props = {
  items: CustomerTimelineItem[];
  loading: boolean;
  error: string | null;
  notes: CustomerNoteItem[];
  onRetry: () => void;
};

const NOTE_KINDS = new Set([
  "internal_note_added",
  "follow_up_scheduled",
  "follow_up_completed",
]);

function severityToChipKind(severity: CustomerTimelineSeverity | string): OperatorStatusKind {
  if (severity === "success") return "confirmed";
  if (severity === "attention") return "attention";
  if (severity === "muted") return "inactive";
  if (severity === "info") return "pending";
  return "pending";
}

function chipLabelForItem(it: CustomerTimelineItem): string {
  switch (it.kind) {
    case "customer_joined_business":
      return "Joined";
    case "standby_preferences_saved":
      return "Standby";
    case "opening_alert_sent":
      return "Alert";
    case "claim_submitted":
      return "Claim";
    case "claim_confirmed":
      return "Booked";
    case "internal_note_added":
      return "Note";
    case "follow_up_scheduled":
      return "Reminder";
    case "follow_up_completed":
      return "Done";
    default:
      return "Event";
  }
}

export function CustomerTimelineSection({ items, loading, error, notes, onRetry }: Props) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const noteBodyById = useMemo(() => {
    const m = new Map<string, string>();
    for (const n of notes) m.set(n.id, n.body);
    return m;
  }, [notes]);

  function toggle(id: string) {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  return (
    <section style={{ padding: "14px 16px", ...operatorSurfaceShell("quiet") }}>
      <h2 className="pf-section-title" style={{ fontSize: 15, margin: "0 0 6px" }}>
        Timeline
      </h2>
      <p className="pf-muted-copy" style={{ margin: "0 0 12px", fontSize: 12, lineHeight: 1.5 }}>
        One chronological view of membership, standby, opening alerts, claims, and internal notes — staff context only.
      </p>

      {error ? (
        <div style={{ marginBottom: 12 }}>
          <OperatorErrorState rawMessage={error} />
          <button
            type="button"
            onClick={() => void onRetry()}
            style={{
              marginTop: 8,
              borderRadius: 8,
              border: "1px solid rgba(255,255,255,0.14)",
              background: "rgba(255,255,255,0.06)",
              color: "var(--text)",
              padding: "6px 12px",
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            Retry
          </button>
        </div>
      ) : null}

      {loading && items.length === 0 && !error ? (
        <OperatorLoadingState variant="section" skeleton="rows" title="Loading timeline…" />
      ) : null}

      {!loading && !error && items.length === 0 ? (
        <p className="pf-muted-copy" style={{ margin: 0, fontSize: 13, lineHeight: 1.55 }}>
          No timeline yet. Activity will appear as this customer joins standby, receives opening alerts, claims openings, or
          gets internal notes.
        </p>
      ) : null}

      {!error && items.length > 0 ? (
        <OperatorRowList density="compact">
          {items.map((it) => {
            const noteId = it.metadata.note_id;
            const preview = it.metadata.preview;
            const showNoteToggle = NOTE_KINDS.has(it.kind) && Boolean(noteId);
            const fullBody = noteId ? noteBodyById.get(noteId) : undefined;
            const isOpen = Boolean(expanded[it.id]);

            return (
              <OperatorRow
                key={it.id}
                title={it.title}
                meta={
                  <div style={{ fontSize: 12, color: "rgba(245,247,250,0.82)", lineHeight: 1.45 }}>
                    <div>{it.description}</div>
                    {preview ? (
                      <div style={{ marginTop: 6, color: "var(--muted)", fontSize: 11 }}>
                        {isOpen && fullBody ? fullBody : preview}
                      </div>
                    ) : null}
                    <span style={{ display: "block", marginTop: 6, fontSize: 11, color: "var(--muted)" }}>
                      {new Date(it.occurred_at).toLocaleString()}
                    </span>
                    {showNoteToggle && fullBody && fullBody !== preview ? (
                      <div style={{ marginTop: 8 }}>
                        <MotionTapSurface>
                          <button
                            type="button"
                            onClick={() => toggle(it.id)}
                            style={{
                              borderRadius: 8,
                              border: "1px solid rgba(255,255,255,0.14)",
                              background: "rgba(255,255,255,0.06)",
                              color: "var(--text)",
                              padding: "5px 10px",
                              fontSize: 11,
                              fontWeight: 600,
                              cursor: "pointer",
                              fontFamily: "inherit",
                            }}
                          >
                            {isOpen ? "Hide note" : "View note"}
                          </button>
                        </MotionTapSurface>
                      </div>
                    ) : null}
                  </div>
                }
                status={
                  <OperatorStatusChip kind={severityToChipKind(it.severity)} label={chipLabelForItem(it)} caps />
                }
              />
            );
          })}
        </OperatorRowList>
      ) : null}
    </section>
  );
}
