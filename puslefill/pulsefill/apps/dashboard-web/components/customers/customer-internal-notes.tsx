"use client";

import { useMemo, useState, type CSSProperties } from "react";
import { OperatorLoadingState } from "@/components/operator/operator-loading-state";
import { OperatorErrorState } from "@/components/operator/operator-error-state";
import { OperatorRow, OperatorRowList } from "@/components/operator/operator-row-list";
import { OperatorStatusChip } from "@/components/operator/operator-status-chip";
import type { OperatorStatusKind } from "@/components/operator/operator-status-chip";
import { MotionTapSurface } from "@/components/operator/operator-motion-primitives";
import { operatorSurfaceShell } from "@/lib/operator-surface-styles";
import type { CustomerNoteItem } from "@/hooks/useCustomerNotes";

type Props = {
  notes: CustomerNoteItem[];
  loading: boolean;
  error: string | null;
  saving: boolean;
  onAddNote: (body: string, followUpAtIso: string | null) => Promise<{ ok: true } | { ok: false; message: string }>;
  onCompleteFollowUp: (noteId: string) => Promise<{ ok: true } | { ok: false; message: string }>;
  onRetry: () => void;
};

const textareaStyle: CSSProperties = {
  width: "100%",
  minHeight: 72,
  resize: "vertical" as const,
  borderRadius: 10,
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(0,0,0,0.2)",
  color: "var(--text)",
  padding: "10px 12px",
  fontSize: 13,
  fontFamily: "inherit",
  lineHeight: 1.45,
};

const btnStyle: CSSProperties = {
  borderRadius: 10,
  border: "1px solid var(--pf-accent-primary-border)",
  background: "linear-gradient(180deg, #ff7a18 0%, #f97316 100%)",
  color: "var(--pf-btn-primary-text)",
  padding: "8px 14px",
  fontSize: 13,
  fontWeight: 700,
  cursor: "pointer",
  fontFamily: "inherit",
};

function localDayKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function followUpChip(n: CustomerNoteItem): { label: string; kind: OperatorStatusKind } | null {
  if (!n.follow_up_at) return null;
  if (n.follow_up_completed_at) return { label: "Completed", kind: "confirmed" };
  const due = new Date(n.follow_up_at).getTime();
  const now = Date.now();
  if (due < now) return { label: "Overdue", kind: "failed" };
  if (localDayKey(new Date(due)) === localDayKey(new Date())) return { label: "Due today", kind: "attention" };
  return { label: "Scheduled", kind: "pending" };
}

function openFollowUpSummary(n: CustomerNoteItem): string {
  if (!n.follow_up_at || n.follow_up_completed_at) return "";
  const due = new Date(n.follow_up_at).getTime();
  const now = Date.now();
  if (due < now) return "Overdue";
  if (localDayKey(new Date(due)) === localDayKey(new Date())) return "Due today";
  return `Due ${new Date(n.follow_up_at).toLocaleString()}`;
}

export function CustomerInternalNotes({
  notes,
  loading,
  error,
  saving,
  onAddNote,
  onCompleteFollowUp,
  onRetry,
}: Props) {
  const [draft, setDraft] = useState("");
  const [remind, setRemind] = useState(false);
  const [remindLocal, setRemindLocal] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const [completeBusy, setCompleteBusy] = useState<string | null>(null);

  const openFollowUps = useMemo(() => {
    return notes
      .filter((n) => n.follow_up_at && !n.follow_up_completed_at)
      .slice()
      .sort((a, b) => new Date(a.follow_up_at!).getTime() - new Date(b.follow_up_at!).getTime());
  }, [notes]);

  async function submit() {
    setLocalError(null);
    const trimmed = draft.trim();
    if (!trimmed) {
      setLocalError("Write something before saving.");
      return;
    }
    if (trimmed.length > 2000) {
      setLocalError("Note is too long (max 2000 characters).");
      return;
    }
    let followIso: string | null = null;
    if (remind) {
      if (!remindLocal) {
        setLocalError("Choose a reminder date and time.");
        return;
      }
      const t = new Date(remindLocal).getTime();
      if (Number.isNaN(t)) {
        setLocalError("Reminder date is not valid.");
        return;
      }
      followIso = new Date(t).toISOString();
    }
    const r = await onAddNote(trimmed, followIso);
    if (r.ok) {
      setDraft("");
      setRemind(false);
      setRemindLocal("");
    } else {
      setLocalError(r.message);
    }
  }

  async function markStripComplete(noteId: string) {
    setLocalError(null);
    setCompleteBusy(noteId);
    const r = await onCompleteFollowUp(noteId);
    setCompleteBusy(null);
    if (!r.ok) setLocalError(r.message);
  }

  return (
    <section style={{ padding: "14px 16px", ...operatorSurfaceShell("quiet") }}>
      <h2 className="pf-section-title" style={{ fontSize: 15, margin: "0 0 6px" }}>
        Internal notes
      </h2>
      <p className="pf-muted-copy" style={{ margin: "0 0 12px", fontSize: 12, lineHeight: 1.5 }}>
        Only staff in this workspace can see these notes and reminders.
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

      {openFollowUps.length > 0 ? (
        <div
          style={{
            marginBottom: 14,
            padding: "12px 12px",
            borderRadius: 10,
            border: "1px solid rgba(255, 122, 24, 0.22)",
            background: "rgba(255, 122, 24, 0.06)",
          }}
        >
          <p className="pf-kicker" style={{ margin: 0, fontSize: 10 }}>
            Open follow-ups
          </p>
          <OperatorRowList density="compact" style={{ marginTop: 8 }}>
            {openFollowUps.map((n) => (
              <OperatorRow
                key={n.id}
                title={n.body.length > 140 ? `${n.body.slice(0, 137)}…` : n.body}
                meta={
                  <span style={{ fontSize: 11, color: "var(--muted)" }}>
                    {openFollowUpSummary(n)} · {n.created_by.name}
                  </span>
                }
                status={<OperatorStatusChip kind="attention" label="Open" caps />}
                action={
                  <MotionTapSurface disabled={completeBusy === n.id}>
                    <button
                      type="button"
                      disabled={completeBusy === n.id}
                      onClick={() => void markStripComplete(n.id)}
                      style={{
                        borderRadius: 8,
                        border: "1px solid rgba(255,255,255,0.14)",
                        background: "rgba(255,255,255,0.06)",
                        color: "var(--text)",
                        padding: "6px 10px",
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: completeBusy === n.id ? "wait" : "pointer",
                        fontFamily: "inherit",
                      }}
                    >
                      {completeBusy === n.id ? "…" : "Mark complete"}
                    </button>
                  </MotionTapSurface>
                }
              />
            ))}
          </OperatorRowList>
        </div>
      ) : null}

      <label style={{ display: "block", fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>
        New note
      </label>
      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder="e.g. Prefers morning openings, call after 5 PM…"
        style={textareaStyle}
        maxLength={2100}
        disabled={saving}
        aria-label="Internal note text"
      />

      <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10, fontSize: 13, cursor: "pointer" }}>
        <input
          type="checkbox"
          checked={remind}
          onChange={(e) => setRemind(e.target.checked)}
          disabled={saving}
        />
        Add follow-up reminder
      </label>
      {remind ? (
        <div style={{ marginTop: 8 }}>
          <label htmlFor="pf-internal-note-remind" className="pf-muted-copy" style={{ display: "block", fontSize: 11, marginBottom: 4 }}>
            Date and time (your timezone)
          </label>
          <input
            id="pf-internal-note-remind"
            type="datetime-local"
            value={remindLocal}
            onChange={(e) => setRemindLocal(e.target.value)}
            disabled={saving}
            style={{
              borderRadius: 8,
              border: "1px solid rgba(255,255,255,0.14)",
              background: "rgba(0,0,0,0.25)",
              color: "var(--text)",
              padding: "8px 10px",
              fontSize: 13,
              fontFamily: "inherit",
            }}
          />
        </div>
      ) : null}

      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", marginTop: 10 }}>
        <button type="button" style={btnStyle} disabled={saving} onClick={() => void submit()}>
          {saving ? "Saving…" : "Add note"}
        </button>
        {localError ? (
          <span style={{ fontSize: 12, color: "#f87171" }} role="alert">
            {localError}
          </span>
        ) : null}
      </div>

      <h3 className="pf-muted-copy" style={{ margin: "18px 0 8px", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.04em" }}>
        History
      </h3>

      {loading && notes.length === 0 && !error ? (
        <OperatorLoadingState variant="section" skeleton="rows" title="Loading notes…" />
      ) : notes.length === 0 ? (
        <p className="pf-muted-copy" style={{ margin: 0, fontSize: 13, lineHeight: 1.55 }}>
          No internal notes yet. Add context your team should remember about this customer.
        </p>
      ) : (
        <OperatorRowList density="compact">
          {notes.map((n) => {
            const chip = followUpChip(n);
            return (
              <OperatorRow
                key={n.id}
                title={n.body}
                meta={
                  <span style={{ fontSize: 11, color: "var(--muted)" }}>
                    {n.created_by.name} · {new Date(n.created_at).toLocaleString()}
                    {n.follow_up_at && !n.follow_up_completed_at ? (
                      <span style={{ display: "block", marginTop: 4 }}>
                        Reminder: {new Date(n.follow_up_at).toLocaleString()}
                      </span>
                    ) : null}
                  </span>
                }
                status={chip ? <OperatorStatusChip kind={chip.kind} label={chip.label} caps /> : undefined}
              />
            );
          })}
        </OperatorRowList>
      )}
    </section>
  );
}
