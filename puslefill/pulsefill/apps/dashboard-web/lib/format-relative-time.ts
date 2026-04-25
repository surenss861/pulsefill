/** Short relative time for operator feeds (e.g. "5 mins ago"). */
export function formatRelativeTime(iso: string, nowMs: number = Date.now()): string {
  let t: number;
  try {
    t = new Date(iso).getTime();
  } catch {
    return iso;
  }
  if (Number.isNaN(t)) return iso;

  const sec = Math.max(0, Math.floor((nowMs - t) / 1000));
  if (sec < 45) return "Just now";
  if (sec < 3600) {
    const m = Math.floor(sec / 60);
    return `${m} min${m === 1 ? "" : "s"} ago`;
  }
  if (sec < 86400) {
    const h = Math.floor(sec / 3600);
    return `${h} hr${h === 1 ? "" : "s"} ago`;
  }
  const d = Math.floor(sec / 86400);
  if (d < 14) return `${d} day${d === 1 ? "" : "s"} ago`;
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return iso;
  }
}
