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

export type MatchDiagnosticReason =
  | "no_active_membership"
  | "no_active_preferences"
  | "duplicate_offer"
  | "service_mismatch"
  | "location_mismatch"
  | "provider_mismatch"
  | "outside_availability_days"
  | "outside_availability_time"
  | "notice_window_mismatch"
  | "deposit_not_accepted"
  | "no_notification_channel"
  | "matched";

export type MatchDiagnostic = {
  customer_id: string;
  preference_id: string | null;
  reason: MatchDiagnosticReason;
};

export type MatchSummary = {
  total_preferences_checked: number;
  matched: number;
  rejected: Partial<Record<Exclude<MatchDiagnosticReason, "matched">, number>>;
};

export type StandbyMatchPack = {
  matches: StandbyPreferenceRow[];
  diagnostics: MatchDiagnostic[];
  summary: MatchSummary;
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

/** Geometry + availability checks only (membership / duplicate handled upstream). */
function preferenceMatchFailureReason(
  slot: OpenSlotRow,
  business: BusinessRow,
  pref: StandbyPreferenceRow,
): MatchDiagnosticReason | null {
  if (pref.location_id && slot.location_id && pref.location_id !== slot.location_id) {
    return "location_mismatch";
  }
  if (pref.service_id && slot.service_id && pref.service_id !== slot.service_id) {
    return "service_mismatch";
  }
  if (pref.provider_id && slot.provider_id && pref.provider_id !== slot.provider_id) {
    return "provider_mismatch";
  }

  const start = new Date(slot.starts_at);
  const days = pref.days_of_week ?? [];
  if (days.length > 0) {
    const d = weekdayMon0(start, business.timezone);
    if (!days.includes(d)) return "outside_availability_days";
  }

  const startMins = minutesFromMidnight(start, business.timezone);
  const earliest = parseTimeToMinutes(pref.earliest_time);
  const latest = parseTimeToMinutes(pref.latest_time);
  if (earliest !== null && startMins < earliest) return "outside_availability_time";
  if (latest !== null && startMins > latest) return "outside_availability_time";

  if (pref.max_notice_hours !== null) {
    const hoursUntil = (start.getTime() - Date.now()) / 3_600_000;
    if (hoursUntil > pref.max_notice_hours) return "notice_window_mismatch";
  }

  void pref.max_distance_km;
  void pref.deposit_ok;
  return null;
}

export function matchesStandbyPreference(
  slot: OpenSlotRow,
  business: BusinessRow,
  pref: StandbyPreferenceRow,
): boolean {
  return preferenceMatchFailureReason(slot, business, pref) === null;
}

/** @deprecated Prefer {@link matchStandbyPreferencesForSendOffers} with membership + duplicate context. */
export function filterMatchingPreferences(
  slot: OpenSlotRow,
  business: BusinessRow,
  prefs: StandbyPreferenceRow[],
): StandbyPreferenceRow[] {
  return prefs.filter((p) => matchesStandbyPreference(slot, business, p));
}

function buildSummary(diagnostics: MatchDiagnostic[], totalPrefs: number): MatchSummary {
  const rejected: MatchSummary["rejected"] = {};
  let matched = 0;
  for (const d of diagnostics) {
    if (d.reason === "matched") {
      matched += 1;
    } else {
      rejected[d.reason] = (rejected[d.reason] ?? 0) + 1;
    }
  }
  return {
    total_preferences_checked: totalPrefs,
    matched,
    rejected,
  };
}

/**
 * Evaluates each active preference: duplicate offer → membership → geometry.
 * Invite / request / public membership sources are treated the same (active row only).
 */
export function matchStandbyPreferencesForSendOffers(
  slot: OpenSlotRow,
  business: BusinessRow,
  prefs: StandbyPreferenceRow[],
  activeMemberCustomerIds: Set<string>,
  existingOfferCustomerIds: Set<string>,
): StandbyMatchPack {
  const diagnostics: MatchDiagnostic[] = [];
  const matches: StandbyPreferenceRow[] = [];

  for (const pref of prefs) {
    const base = { customer_id: pref.customer_id, preference_id: pref.id };
    if (existingOfferCustomerIds.has(pref.customer_id)) {
      diagnostics.push({ ...base, reason: "duplicate_offer" });
      continue;
    }
    if (!activeMemberCustomerIds.has(pref.customer_id)) {
      diagnostics.push({ ...base, reason: "no_active_membership" });
      continue;
    }
    const fail = preferenceMatchFailureReason(slot, business, pref);
    if (fail) {
      diagnostics.push({ ...base, reason: fail });
      continue;
    }
    diagnostics.push({ ...base, reason: "matched" });
    matches.push(pref);
  }

  return {
    matches,
    diagnostics,
    summary: buildSummary(diagnostics, prefs.length),
  };
}

export function noMatchesReasonFromSummary(summary: MatchSummary): string {
  if (summary.total_preferences_checked === 0) {
    return "no_active_preferences";
  }
  if (summary.matched > 0) {
    return "";
  }
  return "no_matching_standby_customers";
}
