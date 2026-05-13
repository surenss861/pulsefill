"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/toast-provider";
import { MotionTapSurface } from "@/components/operator/operator-motion-primitives";
import { emitOperatorRefreshEvent } from "@/lib/operator-refresh-events";
import { saveOperatorSlotNote } from "@/lib/operator-slot-notes";
import { OPERATOR_RESOLUTION_STATUSES, type OperatorResolutionStatusValue } from "@/lib/operator-resolution-status";

type Props = {
  openSlotId: string;
  initialNote: string | null | undefined;
  initialResolutionStatus: string | null | undefined;
  initialUpdatedAt: string | null | undefined;
  onSaved?: () => void;
};

function formatUpdatedAt(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

export function OperatorInternalNoteCard({
  openSlotId,
  initialNote,
  initialResolutionStatus,
  initialUpdatedAt,
  onSaved,
}: Props) {
  const { showToast } = useToast();
  const [note, setNote] = useState(initialNote ?? "");
  const [resolution, setResolution] = useState<OperatorResolutionStatusValue>(
    (initialResolutionStatus as OperatorResolutionStatusValue) ?? "none",
  );
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [updatedLabel, setUpdatedLabel] = useState<string | null>(() => formatUpdatedAt(initialUpdatedAt ?? null));

  useEffect(() => {
    setNote(initialNote ?? "");
    const valid =
      initialResolutionStatus != null &&
      OPERATOR_RESOLUTION_STATUSES.some((o) => o.value === initialResolutionStatus);
    setResolution(valid ? (initialResolutionStatus as OperatorResolutionStatusValue) : "none");
    setUpdatedLabel(formatUpdatedAt(initialUpdatedAt ?? null));
    setSaveError(null);
  }, [openSlotId, initialNote, initialResolutionStatus, initialUpdatedAt]);

  async function handleSave() {
    try {
      setSaving(true);
      setSaveError(null);
      const res = await saveOperatorSlotNote({
        openSlotId,
        internalNote: note,
        resolutionStatus: resolution,
      });
      setUpdatedLabel(formatUpdatedAt(res.internal_note_updated_at));
      showToast({
        title: res.message?.trim() || "Note saved.",
        tone: "success",
      });
      emitOperatorRefreshEvent("slot:note_updated", { slotId: openSlotId, action: "add_note" });
      onSaved?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong.";
      setSaveError(message);
      showToast({ title: "Note did not save.", tone: "error" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <p className="pf-desk-hero-card__eyebrow" style={{ margin: 0, fontSize: 12 }}>
          Team note
        </p>
        <p className="pf-muted-copy" style={{ margin: "8px 0 0", fontSize: 15, lineHeight: 1.55 }}>
          Add anything your team should know about this opening.
        </p>
      </div>

      <label className="pf-desk-invite-label" htmlFor={`pf-slot-note-resolution-${openSlotId}`}>
        How you closed the loop
        <span className="pf-desk-invite-label__hint">Optional — helps the next shift see what happened.</span>
        <select
          id={`pf-slot-note-resolution-${openSlotId}`}
          className="pf-desk-invite-input"
          value={resolution}
          onChange={(e) => setResolution(e.target.value as OperatorResolutionStatusValue)}
        >
          {OPERATOR_RESOLUTION_STATUSES.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>

      <label className="pf-desk-invite-label" htmlFor={`pf-slot-note-body-${openSlotId}`}>
        Note
        <span className="pf-desk-invite-label__hint">What should another staff member know?</span>
        <textarea
          id={`pf-slot-note-body-${openSlotId}`}
          className="pf-desk-invite-input"
          value={note}
          onChange={(e) => {
            setNote(e.target.value);
            if (saveError) setSaveError(null);
          }}
          rows={4}
          placeholder="e.g. Customer called the front desk — booked outside PulseFill."
        />
      </label>

      {saveError ? (
        <div className="pf-desk-invite-error" role="alert">
          <p className="pf-desk-hero-card__eyebrow" style={{ margin: 0 }}>
            Note did not save
          </p>
          <p className="pf-muted-copy" style={{ margin: "8px 0 0", fontSize: 14, lineHeight: 1.55 }}>
            Try again in a moment.
          </p>
          <p className="pf-muted-copy" style={{ margin: "6px 0 0", fontSize: 12, lineHeight: 1.45 }}>
            {saveError}
          </p>
          <div style={{ marginTop: 12 }}>
            <button type="button" className="pf-desk-confirm-modal__btn-quiet" onClick={() => setSaveError(null)}>
              Try again
            </button>
          </div>
        </div>
      ) : null}

      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12 }}>
        <MotionTapSurface disabled={saving}>
          <button
            type="button"
            className="pf-desk-save-access pf-desk-team-note-save"
            disabled={saving}
            onClick={() => void handleSave()}
          >
            {saving ? "Saving…" : "Save note"}
          </button>
        </MotionTapSurface>
        {updatedLabel ? (
          <span className="pf-muted-copy" style={{ fontSize: 12 }}>
            Last saved {updatedLabel}
          </span>
        ) : null}
      </div>
    </div>
  );
}
