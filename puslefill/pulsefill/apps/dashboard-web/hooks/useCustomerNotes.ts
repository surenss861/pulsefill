"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

export type CustomerNoteItem = {
  id: string;
  body: string;
  created_at: string;
  follow_up_at: string | null;
  follow_up_completed_at: string | null;
  created_by: { name: string };
};

type NotesListResponse = {
  customer_id: string;
  notes: CustomerNoteItem[];
};

type NoteCreateResponse = {
  note: CustomerNoteItem;
};

export function useCustomerNotes(customerId: string | undefined) {
  const [notes, setNotes] = useState<CustomerNoteItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!customerId) {
      setNotes([]);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<NotesListResponse>(`/v1/businesses/mine/customers/${customerId}/notes`);
      const rows = Array.isArray(res.notes) ? res.notes : [];
      setNotes(
        rows.map((n) => ({
          ...n,
          follow_up_at: n.follow_up_at ?? null,
          follow_up_completed_at: n.follow_up_completed_at ?? null,
        })),
      );
    } catch (err) {
      setNotes([]);
      setError(err instanceof Error ? err.message : "Could not load notes.");
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    void load();
  }, [load]);

  const addNote = useCallback(
    async (
      body: string,
      followUpAtIso: string | null = null,
    ): Promise<{ ok: true } | { ok: false; message: string }> => {
      if (!customerId) return { ok: false, message: "Missing customer." };
      setSaving(true);
      setError(null);
      try {
        const payload: { body: string; follow_up_at?: string } = { body };
        if (followUpAtIso) payload.follow_up_at = followUpAtIso;
        const res = await apiFetch<NoteCreateResponse>(`/v1/businesses/mine/customers/${customerId}/notes`, {
          method: "POST",
          body: JSON.stringify(payload),
        });
        if (res?.note) {
          setNotes((prev) => [res.note, ...prev]);
        } else {
          await load();
        }
        return { ok: true };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Could not save note.";
        return { ok: false, message };
      } finally {
        setSaving(false);
      }
    },
    [customerId, load],
  );

  const completeFollowUp = useCallback(
    async (noteId: string): Promise<{ ok: true } | { ok: false; message: string }> => {
      if (!customerId) return { ok: false, message: "Missing customer." };
      setError(null);
      try {
        const res = await apiFetch<NoteCreateResponse>(
          `/v1/businesses/mine/customers/${customerId}/notes/${noteId}/complete-follow-up`,
          { method: "POST" },
        );
        if (res?.note) {
          setNotes((prev) => prev.map((n) => (n.id === noteId ? res.note : n)));
        } else {
          await load();
        }
        return { ok: true };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Could not mark follow-up complete.";
        return { ok: false, message };
      }
    },
    [customerId, load],
  );

  return { notes, loading, error, saving, reload: load, addNote, completeFollowUp };
}
