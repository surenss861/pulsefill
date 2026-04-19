/** Snapshot of what was just created, for the success panel (no extra GET). */
export type OpenSlotCreatedSummary = {
  slotId: string;
  providerLabel: string;
  startsAt: string;
  endsAt: string;
  serviceLabel: string | null;
  locationLabel: string | null;
  estimatedValueCents: number | null;
};
