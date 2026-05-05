/** Human-readable slot time for push body copy (Toronto default matches API dashboards). */
export function formatPushSlotTime(startsAt: string): string {
  const date = new Date(startsAt);
  if (Number.isNaN(date.getTime())) return "soon";
  return new Intl.DateTimeFormat("en-CA", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Toronto",
  }).format(date);
}
