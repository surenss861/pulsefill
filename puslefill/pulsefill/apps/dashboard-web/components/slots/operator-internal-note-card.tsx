"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/toast-provider";
import { pressableHandlers, pressablePrimary } from "@/lib/pressable";
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
  const [updatedLabel, setUpdatedLabel] = useState<string | null>(() => formatUpdatedAt(initialUpdatedAt ?? null));

  useEffect(() => {
    setNote(initialNote ?? "");
    const valid =
      initialResolutionStatus != null &&
      OPERATOR_RESOLUTION_STATUSES.some((o) => o.value === initialResolutionStatus);
    setResolution(valid ? (initialResolutionStatus as OperatorResolutionStatusValue) : "none");
    setUpdatedLabel(formatUpdatedAt(initialUpdatedAt ?? null));
  }, [openSlotId, initialNote, initialResolutionStatus, initialUpdatedAt]);

  async function handleSave() {
    try {
      setSaving(true);
      const res = await saveOperatorSlotNote({
        openSlotId,
        internalNote: note,
        resolutionStatus: resolution,
      });
      setUpdatedLabel(formatUpdatedAt(res.internal_note_updated_at));
      showToast({
        title: res.message?.trim() || "Internal note saved.",
        tone: "success",
      });
      onSaved?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not save internal note";
      showToast({ title: message, tone: "error" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      style={{
        borderRadius: 16,
        border: "1px solid rgba(255,255,255,0.08)",
        background: "rgba(0,0,0,0.2)",
        padding: 16,
      }}
    >
      <p style={{ margin: 0, fontSize: 11, color: "var(--muted)", letterSpacing: "0.04em" }}>INTERNAL NOTE</p>
      <p style={{ margin: "6px 0 0", fontSize: 13, color: "var(--muted)" }}>
        Visible to staff only. Use for handoff and how this slot was handled.
      </p>

      <label style={{ display: "block", marginTop: 14, fontSize: 12, color: "var(--muted)" }}>Resolution</label>
      <select
        value={resolution}
        onChange={(e) => setResolution(e.target.value as OperatorResolutionStatusValue)}
        style={{
          marginTop: 6,
          width: "100%",
          maxWidth: 360,
          padding: "10px 12px",
          borderRadius: 10,
          border: "1px solid rgba(255,255,255,0.12)",
          background: "rgba(0,0,0,0.35)",
          color: "var(--foreground)",
          fontSize: 14,
        }}
      >
        {OPERATOR_RESOLUTION_STATUSES.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>

      <label style={{ display: "block", marginTop: 14, fontSize: 12, color: "var(--muted)" }}>Note</label>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={4}
        placeholder="e.g. Customer called front desk — handled outside PulseFill."
        style={{
          marginTop: 6,
          width: "100%",
          boxSizing: "border-box",
          padding: 12,
          borderRadius: 10,
          border: "1px solid rgba(255,255,255,0.12)",
          background: "rgba(0,0,0,0.35)",
          color: "var(--foreground)",
          fontSize: 14,
          resize: "vertical",
          minHeight: 96,
        }}
      />

      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12, marginTop: 12 }}>
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={saving}
          style={{
            ...pressablePrimary,
            opacity: saving ? 0.6 : 1,
            cursor: saving ? "not-allowed" : "pointer",
          }}
          {...pressableHandlers}
        >
          {saving ? "Saving…" : "Save"}
        </button>
        {updatedLabel ? (
          <span style={{ fontSize: 12, color: "var(--muted)" }}>Last updated {updatedLabel}</span>
        ) : null}
      </div>
    </div>
  );
}
