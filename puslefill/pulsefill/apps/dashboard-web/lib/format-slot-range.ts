/** Display open slot window for operator lists (local timezone). */
export function formatSlotRange(startsAt: string, endsAt: string): string {
  const s = new Date(startsAt);
  const e = new Date(endsAt);
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return "—";
  const dateFmt = new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const timeFmt = new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" });
  const sameDay = s.toDateString() === e.toDateString();
  if (sameDay) {
    return `${dateFmt.format(s)} · ${timeFmt.format(s)}–${timeFmt.format(e)}`;
  }
  return `${dateFmt.format(s)} ${timeFmt.format(s)} → ${dateFmt.format(e)} ${timeFmt.format(e)}`;
}
