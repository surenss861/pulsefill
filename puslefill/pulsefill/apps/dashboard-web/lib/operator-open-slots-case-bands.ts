import { deriveOperatorPrimaryActionFromSlot } from "@/lib/operator-primary-action";
import type { OperatorSlotsListItem } from "@/types/operator-slots-list";

/** Operational “appointment file” stacks for the openings desk (display-only). */
export type OpeningCaseFileBand =
  | "needs_confirmation"
  | "ready_to_send"
  | "watching"
  | "recovered"
  | "ended"
  | "other";

export const OPENING_CASE_BAND_ORDER: OpeningCaseFileBand[] = [
  "needs_confirmation",
  "ready_to_send",
  "watching",
  "recovered",
  "ended",
  "other",
];

export function openingCaseFileBand(slot: OperatorSlotsListItem): OpeningCaseFileBand {
  const st = (slot.status || "").toLowerCase();
  const action = deriveOperatorPrimaryActionFromSlot(slot);

  if (st === "claimed") {
    return action?.kind === "confirm_booking" ? "needs_confirmation" : "other";
  }
  if (st === "open") return "ready_to_send";
  if (st === "offered") return "watching";
  if (st === "booked") return "recovered";
  if (st === "expired" || st === "cancelled") return "ended";
  return "other";
}

function sortByStartsDesc(a: OperatorSlotsListItem, b: OperatorSlotsListItem): number {
  const ta = a.starts_at ? new Date(a.starts_at).getTime() : 0;
  const tb = b.starts_at ? new Date(b.starts_at).getTime() : 0;
  return tb - ta;
}

export function groupSlotsByCaseFileBand(slots: OperatorSlotsListItem[]): Map<OpeningCaseFileBand, OperatorSlotsListItem[]> {
  const map = new Map<OpeningCaseFileBand, OperatorSlotsListItem[]>();
  for (const band of OPENING_CASE_BAND_ORDER) {
    map.set(band, []);
  }
  for (const slot of slots) {
    map.get(openingCaseFileBand(slot))!.push(slot);
  }
  for (const list of map.values()) {
    list.sort(sortByStartsDesc);
  }
  return map;
}

export function caseFileBandCopy(band: OpeningCaseFileBand): { title: string; subtitle: string } {
  switch (band) {
    case "needs_confirmation":
      return {
        title: "Needs confirmation",
        subtitle: "A customer asked for an opening. Confirm the booking before the spot is lost.",
      };
    case "ready_to_send":
      return {
        title: "Ready to send",
        subtitle: "These openings can go to waiting customers — send offers when you are ready.",
      };
    case "watching":
      return {
        title: "Watching",
        subtitle: "Offers went out. PulseFill is waiting for someone to claim.",
      };
    case "recovered":
      return {
        title: "Recovered",
        subtitle: "Bookings your team already confirmed from these openings.",
      };
    case "ended":
      return {
        title: "Ended",
        subtitle: "Expired or cancelled times — kept here for the record.",
      };
    default:
      return {
        title: "Other",
        subtitle: "Appointment files that do not fit the stacks above — still review as needed.",
      };
  }
}
