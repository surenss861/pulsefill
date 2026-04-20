import { apiFetch } from "@/lib/api";

export type SaveOperatorSlotNotePayload = {
  openSlotId: string;
  internalNote: string;
  resolutionStatus: string;
};

export type SaveOperatorSlotNoteResponse = {
  ok: boolean;
  open_slot_id: string;
  internal_note: string | null;
  resolution_status: string;
  internal_note_updated_at: string | null;
  message: string;
};

export async function saveOperatorSlotNote(args: SaveOperatorSlotNotePayload): Promise<SaveOperatorSlotNoteResponse> {
  return apiFetch<SaveOperatorSlotNoteResponse>(`/v1/open-slots/${args.openSlotId}/internal-note`, {
    method: "PATCH",
    body: JSON.stringify({
      internal_note: args.internalNote.trim() === "" ? null : args.internalNote.trim(),
      resolution_status: args.resolutionStatus,
    }),
  });
}
