import type { SupabaseClient } from "@supabase/supabase-js";

export type NoMatchExplanationSummary = {
  total_preferences_checked: number;
  matched: number;
  rejected: Partial<Record<string, number>>;
};

export type NoMatchExplanationBreakdownRow = {
  reason: string;
  count: number;
  label: string;
};

export type NoMatchExplanationGuidanceRow = {
  title: string;
  href: string;
};

export type NoMatchRetryAction = {
  key: string;
  label: string;
  href: string;
  priority: "primary" | "secondary";
  /** Optional operator-safe reason tag for analytics (not raw matcher dump). */
  reason?: string;
};

export type NoMatchRetryGuidance = {
  headline: string;
  message: string;
  recommended_actions: NoMatchRetryAction[];
};

export type NoMatchExplanationResponse = {
  open_slot_id: string;
  has_explanation: boolean;
  /** When `has_explanation`, ISO time of the source audit row. */
  source_observed_at: string | null;
  /** Coarse `no_matches_reason` from send-offers / no-match audit (operator-safe code). */
  reason: string | null;
  headline: string;
  explanation: string;
  summary: NoMatchExplanationSummary | null;
  rejection_breakdown: NoMatchExplanationBreakdownRow[];
  guidance: NoMatchExplanationGuidanceRow[];
  retry_guidance: NoMatchRetryGuidance;
};

/** Staff-facing labels for matcher rejection codes (no PII). */
export const NO_MATCH_REJECTION_LABELS: Record<string, string> = {
  no_active_membership: "Customer not actively connected",
  no_active_preferences: "No active standby preferences",
  duplicate_offer: "Already offered for this opening",
  service_mismatch: "Service did not match",
  location_mismatch: "Location did not match",
  provider_mismatch: "Provider did not match",
  outside_availability_days: "Day did not match availability",
  outside_availability_time: "Time did not match availability",
  notice_window_mismatch: "Notice window did not match",
  deposit_not_accepted: "Deposit requirement not accepted",
  no_notification_channel: "No notification channel available",
  matched: "Matched",
};

const COARSE_REASON_COPY: Record<string, { headline: string; explanation: string }> = {
  no_active_preferences: {
    headline: "No active standby preferences",
    explanation:
      "There were no active standby preferences for this business when offers ran. Invite customers and have them enable standby.",
  },
  no_matching_standby_customers: {
    headline: "No preferences matched this opening",
    explanation:
      "Standby preferences were checked, but none matched this opening’s service, location, provider, availability, or other rules.",
  },
};

export function rejectionLabelForReason(code: string): string {
  if (code === "matched") return NO_MATCH_REJECTION_LABELS["matched"] ?? "Matched";
  return NO_MATCH_REJECTION_LABELS[code] ?? "Other constraint";
}

export function buildRejectionBreakdown(
  rejected: Partial<Record<string, number>> | null | undefined,
): NoMatchExplanationBreakdownRow[] {
  const rows: NoMatchExplanationBreakdownRow[] = [];
  for (const [reason, count] of Object.entries(rejected ?? {})) {
    if (!reason || reason === "matched") continue;
    if (typeof count !== "number" || !Number.isFinite(count) || count <= 0) continue;
    rows.push({ reason, count, label: rejectionLabelForReason(reason) });
  }
  rows.sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
  return rows;
}

function aggregateRejectionsFromDiagnostics(rows: unknown): Partial<Record<string, number>> {
  const out: Partial<Record<string, number>> = {};
  if (!Array.isArray(rows)) return out;
  for (const r of rows) {
    if (!r || typeof r !== "object") continue;
    const reason = (r as Record<string, unknown>).reason;
    if (typeof reason !== "string" || reason === "matched") continue;
    out[reason] = (out[reason] ?? 0) + 1;
  }
  return out;
}

function normalizeSummary(
  raw: unknown,
  diagnostics: unknown,
): NoMatchExplanationSummary | null {
  const fromDiag = aggregateRejectionsFromDiagnostics(diagnostics);
  const diagArr = Array.isArray(diagnostics) ? diagnostics : [];
  const matchedFromDiag = diagArr.filter(
    (d) => d && typeof d === "object" && (d as { reason?: string }).reason === "matched",
  ).length;

  if (raw && typeof raw === "object") {
    const o = raw as Record<string, unknown>;
    const total = o.total_preferences_checked;
    const matched = o.matched;
    const rej = o.rejected;
    if (typeof total === "number" && typeof matched === "number" && rej && typeof rej === "object") {
      const merged: Partial<Record<string, number>> = { ...(rej as Partial<Record<string, number>>) };
      if (Object.keys(merged).filter((k) => k && k !== "matched").length === 0 && Object.keys(fromDiag).length > 0) {
        for (const [k, v] of Object.entries(fromDiag)) {
          const n = typeof v === "number" && Number.isFinite(v) ? v : 0;
          merged[k] = (merged[k] ?? 0) + n;
        }
      }
      return {
        total_preferences_checked: total,
        matched,
        rejected: merged,
      };
    }
  }

  if (Object.keys(fromDiag).length === 0 && diagArr.length === 0) {
    return null;
  }
  const diagFallbackTotal = Object.values(fromDiag).reduce<number>(
    (acc, v) => acc + (typeof v === "number" && Number.isFinite(v) ? v : 0),
    0,
  );
  return {
    total_preferences_checked: diagArr.length > 0 ? diagArr.length : diagFallbackTotal,
    matched: matchedFromDiag,
    rejected: fromDiag,
  };
}

export function guidanceFromRetry(retry: NoMatchRetryGuidance): NoMatchExplanationGuidanceRow[] {
  return retry.recommended_actions.map((a) => ({ title: a.label, href: a.href }));
}

/** Single primary: first listed action stays primary; later primaries are demoted. */
function ensureSinglePrimary(actions: NoMatchRetryAction[]): NoMatchRetryAction[] {
  let primaryDone = false;
  return actions.map((a) => {
    if (a.priority === "primary") {
      if (primaryDone) return { ...a, priority: "secondary" as const };
      primaryDone = true;
    }
    return a;
  });
}

/**
 * Operator-safe retry hints from coarse reason + rejection breakdown (no PII).
 * Exported for unit tests.
 */
export function buildRetryGuidance(
  slotId: string,
  coarse: string | null,
  breakdown: NoMatchExplanationBreakdownRow[],
  hasExplanation: boolean,
): NoMatchRetryGuidance {
  const slotHref = `/open-slots/${slotId}`;
  const reasons = new Set(breakdown.map((b) => b.reason));
  const counts = Object.fromEntries(breakdown.map((b) => [b.reason, b.count])) as Record<string, number>;

  const withRecovery = (actions: NoMatchRetryAction[]): NoMatchRetryAction[] => {
    const next = [...actions];
    if (!next.some((a) => a.key === "recovery_health")) {
      next.push({ key: "recovery_health", label: "Open Recovery Health", href: "/overview", priority: "secondary" });
    }
    return ensureSinglePrimary(next);
  };

  if (!hasExplanation) {
    return {
      headline: "Run send offers to unlock retry tips",
      message:
        "After send-offers returns no matches, PulseFill will tailor headline, counts, and next steps here from the latest attempt.",
      recommended_actions: withRecovery([
        { key: "review_opening", label: "Review opening details", href: slotHref, priority: "primary" },
        { key: "invite", label: "Invite customers", href: "/customers#invite-customer", priority: "secondary" },
      ]),
    };
  }

  const dup = counts["duplicate_offer"] ?? 0;
  const maxNonDup = Math.max(
    0,
    ...breakdown.filter((b) => b.reason !== "duplicate_offer").map((b) => b.count),
  );
  const duplicateDominant = dup > 0 && dup >= maxNonDup;

  if (coarse === "no_active_preferences") {
    return {
      headline: "No standby preferences yet",
      message: "Invite customers and have them enable standby so openings can match.",
      recommended_actions: withRecovery([
        {
          key: "invite",
          label: "Invite customers",
          href: "/customers#invite-customer",
          priority: "primary",
          reason: "no_active_preferences",
        },
        { key: "coverage", label: "Check standby coverage", href: "/customers", priority: "secondary" },
        { key: "review_opening", label: "Review opening details", href: slotHref, priority: "secondary" },
      ]),
    };
  }

  if (duplicateDominant) {
    return {
      headline: "Customers were already offered this opening",
      message: "Check delivery status and offer state before retrying send offers.",
      recommended_actions: withRecovery([
        { key: "delivery_status", label: "Check delivery status", href: slotHref, priority: "primary", reason: "duplicate_offer" },
        { key: "review_opening", label: "Review opening details", href: slotHref, priority: "secondary" },
      ]),
    };
  }

  if (reasons.has("no_active_membership")) {
    return {
      headline: "Some customers are not actively connected",
      message: "They need an active membership before offers can reach them — review requests or invite more customers.",
      recommended_actions: withRecovery([
        {
          key: "standby_requests",
          label: "Review standby requests",
          href: "/customers/standby-requests",
          priority: "primary",
          reason: "no_active_membership",
        },
        { key: "invite", label: "Invite customers", href: "/customers#invite-customer", priority: "secondary" },
        { key: "coverage", label: "Check standby coverage", href: "/customers", priority: "secondary" },
      ]),
    };
  }

  if (reasons.has("service_mismatch")) {
    return {
      headline: "Service coverage is thin",
      message: "Match this opening to services customers watch for, or broaden standby preferences.",
      recommended_actions: withRecovery([
        { key: "coverage", label: "Check standby coverage", href: "/customers", priority: "primary", reason: "service_mismatch" },
        { key: "invite", label: "Invite customers", href: "/customers#invite-customer", priority: "secondary" },
        { key: "review_opening", label: "Review opening details", href: slotHref, priority: "secondary" },
      ]),
    };
  }

  if (reasons.has("location_mismatch") || reasons.has("provider_mismatch")) {
    return {
      headline: "Opening details may be too narrow",
      message: "Location or provider filters may be excluding standby customers who would otherwise match.",
      recommended_actions: withRecovery([
        { key: "review_opening", label: "Review opening details", href: slotHref, priority: "primary" },
        { key: "coverage", label: "Check standby coverage", href: "/customers", priority: "secondary" },
      ]),
    };
  }

  if (reasons.has("outside_availability_days") || reasons.has("outside_availability_time")) {
    return {
      headline: "Availability did not line up",
      message: "Try a time window that fits more standby schedules, or ask customers to widen availability.",
      recommended_actions: withRecovery([
        { key: "coverage", label: "Check standby coverage", href: "/customers", priority: "primary" },
        { key: "review_opening", label: "Review opening details", href: slotHref, priority: "secondary" },
      ]),
    };
  }

  if (reasons.has("notice_window_mismatch")) {
    return {
      headline: "Customers needed more notice",
      message: "Try scheduling farther out or widen notice windows in standby preferences where possible.",
      recommended_actions: withRecovery([
        { key: "review_opening", label: "Review opening details", href: slotHref, priority: "primary" },
        { key: "coverage", label: "Check standby coverage", href: "/customers", priority: "secondary" },
      ]),
    };
  }

  if (coarse === "no_matching_standby_customers" && breakdown.length === 0) {
    return {
      headline: "No matching standby customers",
      message: "Invite more customers to standby and confirm catalog + coverage look healthy.",
      recommended_actions: withRecovery([
        { key: "invite", label: "Invite customers", href: "/customers#invite-customer", priority: "primary" },
        { key: "coverage", label: "Check standby coverage", href: "/customers", priority: "secondary" },
        { key: "review_opening", label: "Review opening details", href: slotHref, priority: "secondary" },
      ]),
    };
  }

  return {
    headline: "No matching standby customers",
    message:
      "Grow your standby pool or align this opening with what customers watch for — then retry send offers when it makes sense.",
    recommended_actions: withRecovery([
      { key: "invite", label: "Invite customers", href: "/customers#invite-customer", priority: "primary" },
      { key: "coverage", label: "Check standby coverage", href: "/customers", priority: "secondary" },
      { key: "review_opening", label: "Review opening details", href: slotHref, priority: "secondary" },
    ]),
  };
}

function headlineAndExplanation(
  coarse: string | null,
  breakdown: NoMatchExplanationBreakdownRow[],
  summary: NoMatchExplanationSummary | null,
): { headline: string; explanation: string } {
  const fromCoarse = coarse && COARSE_REASON_COPY[coarse];
  if (fromCoarse) {
    let explanation = fromCoarse.explanation;
    if (breakdown.length > 0) {
      const parts = breakdown.slice(0, 3).map((b) => `${b.label} (${b.count})`);
      explanation = `${explanation} Common reasons this run: ${parts.join("; ")}.`;
    }
    return { headline: fromCoarse.headline, explanation };
  }
  if (summary && summary.total_preferences_checked > 0) {
    return {
      headline: "Send-offers found no eligible matches",
      explanation:
        breakdown.length > 0
          ? `PulseFill evaluated ${summary.total_preferences_checked} preference(s). See the breakdown for why each did not match.`
          : `PulseFill evaluated ${summary.total_preferences_checked} preference(s); detailed reasons were not recorded for this run.`,
    };
  }
  return {
    headline: "No recent no-match diagnostics",
    explanation: "When send-offers finds no matches, a breakdown will appear here using the latest run’s data.",
  };
}

let buildNoMatchExplanationTestDelegate:
  | null
  | ((admin: SupabaseClient, input: { slotId: string; businessId: string }) => Promise<NoMatchExplanationResponse>) = null;

export function setBuildNoMatchExplanationTestDelegate(
  delegate:
    | ((admin: SupabaseClient, input: { slotId: string; businessId: string }) => Promise<NoMatchExplanationResponse>)
    | null,
): void {
  if (delegate != null && process.env.PULSEFILL_API_TEST !== "1") {
    throw new Error("no match explanation test delegate only when PULSEFILL_API_TEST=1");
  }
  buildNoMatchExplanationTestDelegate = delegate;
}

/** Route layer skips DB slot existence when the test delegate is active (`PULSEFILL_API_TEST=1` only). */
export function isNoMatchExplanationTestDelegateActive(): boolean {
  return buildNoMatchExplanationTestDelegate != null;
}

export async function buildNoMatchExplanation(
  admin: SupabaseClient,
  slotId: string,
  businessId: string,
): Promise<NoMatchExplanationResponse> {
  if (buildNoMatchExplanationTestDelegate) {
    return buildNoMatchExplanationTestDelegate(admin, { slotId, businessId });
  }

  const { data: row, error } = await admin
    .from("audit_events")
    .select("metadata, created_at")
    .eq("business_id", businessId)
    .eq("entity_type", "open_slot")
    .eq("entity_id", slotId)
    .eq("event_type", "offers_no_match")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error("no_match_explanation_audit_failed");
  }

  if (!row) {
    const retry_guidance = buildRetryGuidance(slotId, null, [], false);
    return {
      open_slot_id: slotId,
      has_explanation: false,
      source_observed_at: null,
      reason: null,
      headline: "No recent no-match diagnostics",
      explanation:
        "There is no recorded send-offers run with zero matches for this opening yet. After a no-match, a breakdown will appear here.",
      summary: null,
      rejection_breakdown: [],
      guidance: guidanceFromRetry(retry_guidance),
      retry_guidance,
    };
  }

  const meta = (row as { metadata?: unknown; created_at?: string }).metadata;
  const created_at = typeof (row as { created_at?: unknown }).created_at === "string" ? (row as { created_at: string }).created_at : null;

  const m = meta && typeof meta === "object" ? (meta as Record<string, unknown>) : {};
  const coarse = typeof m.no_matches_reason === "string" ? m.no_matches_reason : null;
  const diagnostics = m.match_diagnostics;
  const summary = normalizeSummary(m.match_summary, diagnostics);
  const rejectedForBreakdown = summary?.rejected ?? aggregateRejectionsFromDiagnostics(diagnostics);
  const breakdown = buildRejectionBreakdown(rejectedForBreakdown);
  const { headline, explanation } = headlineAndExplanation(coarse, breakdown, summary);

  const normalizedSummary: NoMatchExplanationSummary | null = summary
    ? {
        total_preferences_checked: summary.total_preferences_checked,
        matched: summary.matched,
        rejected: rejectedForBreakdown,
      }
    : null;

  const retry_guidance = buildRetryGuidance(slotId, coarse, breakdown, true);
  return {
    open_slot_id: slotId,
    has_explanation: true,
    source_observed_at: created_at,
    reason: coarse,
    headline,
    explanation,
    summary: normalizedSummary,
    rejection_breakdown: breakdown,
    guidance: guidanceFromRetry(retry_guidance),
    retry_guidance,
  };
}
