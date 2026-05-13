"use client";

import { useMemo, useState } from "react";
import { OperatorLoadingState } from "@/components/operator/operator-loading-state";
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
  /** When true, omit outer section shell — for use inside `DeskSecondaryCard`. */
  embedded?: boolean;
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
  embedded = false,
}: Props) {
  const [draft, setDraft] = useState("");
  const [remind, setRemind] = useState(false);
  const [remindLocal, setRemindLocal] = useState("");
  const [validationHint, setValidationHint] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [completeBusy, setCompleteBusy] = useState<string | null>(null);

  const openFollowUps = useMemo(() => {
    return notes
      .filter((n) => n.follow_up_at && !n.follow_up_completed_at)
      .slice()
      .sort((a, b) => new Date(a.follow_up_at!).getTime() - new Date(b.follow_up_at!).getTime());
  }, [notes]);

  async function submit() {
    setValidationHint(null);
    setServerError(null);
    const trimmed = draft.trim();
    if (!trimmed) {
      setValidationHint("Write something before you save.");
      return;
    }
    if (trimmed.length > 2000) {
      setValidationHint("Note is too long (max 2000 characters).");
      return;
    }
    let followIso: string | null = null;
    if (remind) {
      if (!remindLocal) {
        setValidationHint("Choose a reminder date and time.");
        return;
      }
      const t = new Date(remindLocal).getTime();
      if (Number.isNaN(t)) {
        setValidationHint("That reminder date is not valid.");
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
      setServerError(r.message);
    }
  }

  async function markStripComplete(noteId: string) {
    setValidationHint(null);
    setServerError(null);
    setCompleteBusy(noteId);
    const r = await onCompleteFollowUp(noteId);
    setCompleteBusy(null);
    if (!r.ok) setServerError(r.message);
  }

  const inner = (
    <>
      {!embedded ? (
        <h2 className="pf-section-title" style={{ fontSize: 15, margin: "0 0 6px" }}>
          Team notes
        </h2>
      ) : null}
      <p className="pf-muted-copy" style={{ margin: "0 0 12px", fontSize: 14, lineHeight: 1.55 }}>
        Add anything your team should know about this customer. Only people in this workspace can read it.
      </p>

      {error ? (
        <div className="pf-desk-invite-error" role="alert" style={{ marginBottom: 12 }}>
          <p className="pf-desk-hero-card__eyebrow" style={{ margin: 0 }}>
            Notes did not load
          </p>
          <p className="pf-muted-copy" style={{ margin: "8px 0 0", fontSize: 14, lineHeight: 1.55 }}>
            Try again in a moment.
          </p>
          <p className="pf-muted-copy" style={{ margin: "6px 0 0", fontSize: 12, lineHeight: 1.45 }}>
            {error}
          </p>
          <div style={{ marginTop: 12 }}>
            <button type="button" className="pf-desk-confirm-modal__btn-quiet" onClick={() => void onRetry()}>
              Try again
            </button>
          </div>
        </div>
      ) : null}

      {openFollowUps.length > 0 ? (
        <div
          style={{
            marginBottom: 14,
            padding: "12px 14px",
            borderRadius: 14,
            border: "1px solid rgba(255, 122, 24, 0.22)",
            background: "rgba(255, 122, 24, 0.06)",
          }}
        >
          <p className="pf-desk-hero-card__eyebrow" style={{ margin: 0, fontSize: 12 }}>
            Open reminders
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
                status={<OperatorStatusChip kind="attention" label="Open" />}
                action={
                  <MotionTapSurface disabled={completeBusy === n.id}>
                    <button
                      type="button"
                      disabled={completeBusy === n.id}
                      onClick={() => void markStripComplete(n.id)}
                      className="pf-desk-confirm-modal__btn-quiet"
                      style={{
                        padding: "6px 10px",
                        fontSize: 12,
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

      {serverError ? (
        <div className="pf-desk-invite-error" role="alert" style={{ marginBottom: 12 }}>
          <p className="pf-desk-hero-card__eyebrow" style={{ margin: 0 }}>
            Note did not save
          </p>
          <p className="pf-muted-copy" style={{ margin: "8px 0 0", fontSize: 14, lineHeight: 1.55 }}>
            Try again in a moment.
          </p>
          <p className="pf-muted-copy" style={{ margin: "6px 0 0", fontSize: 12, lineHeight: 1.45 }}>
            {serverError}
          </p>
          <div style={{ marginTop: 12 }}>
            <button type="button" className="pf-desk-confirm-modal__btn-quiet" onClick={() => setServerError(null)}>
              Try again
            </button>
          </div>
        </div>
      ) : null}

      <label className="pf-desk-invite-label" htmlFor="pf-customer-team-note-draft">
        Team note
        <span className="pf-desk-invite-label__hint">What should another staff member know?</span>
        <textarea
          id="pf-customer-team-note-draft"
          className="pf-desk-invite-input"
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            setValidationHint(null);
            setServerError(null);
          }}
          placeholder="e.g. Prefers morning openings, call after 5 PM…"
          maxLength={2100}
          disabled={saving}
          aria-label="Team note text"
        />
      </label>

      <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4, fontSize: 14, cursor: "pointer" }}>
        <input type="checkbox" checked={remind} onChange={(e) => setRemind(e.target.checked)} disabled={saving} />
        Add a reminder for later
      </label>
      {remind ? (
        <div style={{ marginTop: 8 }}>
          <label htmlFor="pf-internal-note-remind" className="pf-muted-copy" style={{ display: "block", fontSize: 13, marginBottom: 6 }}>
            Reminder date and time (your timezone)
          </label>
          <input
            id="pf-internal-note-remind"
            type="datetime-local"
            value={remindLocal}
            onChange={(e) => setRemindLocal(e.target.value)}
            disabled={saving}
            className="pf-desk-invite-input"
            style={{ maxWidth: 360 }}
          />
        </div>
      ) : null}

      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", marginTop: 12 }}>
        <MotionTapSurface disabled={saving}>
          <button type="button" className="pf-desk-save-access pf-desk-team-note-save" disabled={saving} onClick={() => void submit()}>
            {saving ? "Saving…" : "Save note"}
          </button>
        </MotionTapSurface>
        {validationHint ? (
          <span className="pf-muted-copy" style={{ fontSize: 12, color: "rgba(248,113,113,0.92)" }} role="status">
            {validationHint}
          </span>
        ) : null}
      </div>

      <p className="pf-muted-copy" style={{ margin: "18px 0 8px", fontSize: 12 }}>
        Previous notes
      </p>

      {loading && notes.length === 0 && !error ? (
        <OperatorLoadingState variant="section" skeleton="rows" title="Loading team notes…" />
      ) : notes.length === 0 ? (
        <p className="pf-muted-copy" style={{ margin: 0, fontSize: 13, lineHeight: 1.55 }}>
          No notes yet. Add what the next shift should remember about this customer.
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
                status={chip ? <OperatorStatusChip kind={chip.kind} label={chip.label} /> : undefined}
              />
            );
          })}
        </OperatorRowList>
      )}
    </>
  );

  if (embedded) {
    return <div>{inner}</div>;
  }

  return <section style={{ padding: "14px 16px", ...operatorSurfaceShell("quiet") }}>{inner}</section>;
}
