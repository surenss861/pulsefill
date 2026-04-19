export type OpenSlotRow = {
  id: string;
  business_id: string;
  location_id: string | null;
  provider_id: string | null;
  service_id: string | null;
  starts_at: string;
};

export type BusinessRow = {
  timezone: string;
};

export type StandbyPreferenceRow = {
  id: string;
  customer_id: string;
  location_id: string | null;
  service_id: string | null;
  provider_id: string | null;
  max_notice_hours: number | null;
  earliest_time: string | null;
  latest_time: string | null;
  days_of_week: number[] | null;
  max_distance_km: number | null;
  deposit_ok: boolean;
};

function weekdayMon0(date: Date, timeZone: string): number {
  const wd = new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone }).format(date);
  const map: Record<string, number> = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 };
  return map[wd] ?? 0;
}

function minutesFromMidnight(date: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? "0");
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? "0");
  return hour * 60 + minute;
}

function parseTimeToMinutes(t: string | null): number | null {
  if (!t) return null;
  const m = /^(\d{1,2}):(\d{2})(?::(\d{2}))?/.exec(t);
  if (!m) return null;
  return Number(m[1]) * 60 + Number(m[2]);
}

export function matchesStandbyPreference(
  slot: OpenSlotRow,
  business: BusinessRow,
  pref: StandbyPreferenceRow,
): boolean {
  if (pref.location_id && slot.location_id && pref.location_id !== slot.location_id) {
    return false;
  }
  if (pref.service_id && slot.service_id && pref.service_id !== slot.service_id) {
    return false;
  }
  if (pref.provider_id && slot.provider_id && pref.provider_id !== slot.provider_id) {
    return false;
  }

  const start = new Date(slot.starts_at);
  const days = pref.days_of_week ?? [];
  if (days.length > 0) {
    const d = weekdayMon0(start, business.timezone);
    if (!days.includes(d)) return false;
  }

  const startMins = minutesFromMidnight(start, business.timezone);
  const earliest = parseTimeToMinutes(pref.earliest_time);
  const latest = parseTimeToMinutes(pref.latest_time);
  if (earliest !== null && startMins < earliest) return false;
  if (latest !== null && startMins > latest) return false;

  if (pref.max_notice_hours !== null) {
    const hoursUntil = (start.getTime() - Date.now()) / 3_600_000;
    if (hoursUntil > pref.max_notice_hours) return false;
  }

  void pref.max_distance_km;
  void pref.deposit_ok;
  return true;
}

export function filterMatchingPreferences(
  slot: OpenSlotRow,
  business: BusinessRow,
  prefs: StandbyPreferenceRow[],
): StandbyPreferenceRow[] {
  return prefs.filter((p) => matchesStandbyPreference(slot, business, p));
}
