import type { SupabaseClient } from "@supabase/supabase-js";

import { buildDailyOpsSummary } from "./daily-ops-summary.js";

export type RecoveryHealthOverallStatus = "ready" | "needs_attention" | "setup_required" | "low_coverage";

export type RecoveryHealthSignalStatus = "ready" | "needs_attention" | "setup_required" | "low_coverage";

export type RecoveryHealthSignal = {
  status: RecoveryHealthSignalStatus;
  label: string;
  value: string;
  details: string;
};

export type RecoveryHealthNextAction = {
  label: string;
  href: string;
  priority: "primary" | "secondary";
};

/** Compact Command Center checklist — only incomplete items, in priority order. */
export type RecoveryReadinessFix = {
  key: "locations" | "providers" | "services" | "standby_pool" | "notification_reach";
  title: string;
  href: string;
};

export type RecoveryHealthResponse = {
  /** ISO timestamp when this snapshot was computed (server clock). */
  evaluated_at: string;
  status: RecoveryHealthOverallStatus;
  headline: string;
  message: string;
  readiness: { fixes: RecoveryReadinessFix[] };
  signals: {
    setup: RecoveryHealthSignal;
    standby_pool: RecoveryHealthSignal;
    notification_reach: RecoveryHealthSignal;
    recent_matching: RecoveryHealthSignal;
    claims: RecoveryHealthSignal;
  };
  next_actions: RecoveryHealthNextAction[];
};

const STANDBY_LOW_CUSTOMERS = 3;
const RECENT_DAYS = 7;
const NO_MATCH_HEAVY = 3;

function sinceIso(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

/** Exported for unit tests — deterministic ordering for Command Center “Fix readiness”. */
export function computeRecoveryReadinessFixes(input: {
  setupComplete: boolean;
  locCount: number;
  provCount: number;
  svcCount: number;
  standbyCount: number;
  reachableCount: number;
  reachRatio: number;
}): RecoveryReadinessFix[] {
  const { setupComplete, locCount, provCount, svcCount, standbyCount, reachableCount, reachRatio } = input;
  const fixes: RecoveryReadinessFix[] = [];
  if (locCount === 0) {
    fixes.push({ key: "locations", title: "Add your first location", href: "/locations" });
  }
  if (provCount === 0) {
    fixes.push({ key: "providers", title: "Add your first provider", href: "/providers" });
  }
  if (svcCount === 0) {
    fixes.push({ key: "services", title: "Add your first service", href: "/services" });
  }
  if (setupComplete && standbyCount < STANDBY_LOW_CUSTOMERS) {
    fixes.push({
      key: "standby_pool",
      title: standbyCount === 0 ? "Invite customers to standby" : "Grow your standby pool",
      href: "/customers#invite-customer",
    });
  }
  if (setupComplete && standbyCount > 0 && (reachableCount === 0 || reachRatio < 0.5)) {
    fixes.push({
      key: "notification_reach",
      title: "Improve notification reach for standby customers",
      href: "/customers",
    });
  }
  return fixes.slice(0, 5);
}

let buildRecoveryHealthTestDelegate:
  | null
  | ((admin: SupabaseClient, businessId: string) => Promise<RecoveryHealthResponse>) = null;

export function setBuildRecoveryHealthTestDelegate(
  delegate: ((admin: SupabaseClient, businessId: string) => Promise<RecoveryHealthResponse>) | null,
): void {
  if (delegate != null && process.env.PULSEFILL_API_TEST !== "1") {
    throw new Error("recovery health test delegate is only available when PULSEFILL_API_TEST=1");
  }
  buildRecoveryHealthTestDelegate = delegate;
}

export async function buildRecoveryHealth(admin: SupabaseClient, businessId: string): Promise<RecoveryHealthResponse> {
  if (buildRecoveryHealthTestDelegate) {
    return buildRecoveryHealthTestDelegate(admin, businessId);
  }

  const since7d = sinceIso(RECENT_DAYS);
  const since30d = sinceIso(30);

  const [locRes, provRes, svcRes, prefsRes, slotIdsRes, noMatchRes, dailyOps] = await Promise.all([
    admin.from("locations").select("id", { count: "exact", head: true }).eq("business_id", businessId).eq("active", true),
    admin.from("providers").select("id", { count: "exact", head: true }).eq("business_id", businessId).eq("active", true),
    admin.from("services").select("id", { count: "exact", head: true }).eq("business_id", businessId).eq("active", true),
    admin.from("standby_preferences").select("customer_id").eq("business_id", businessId).eq("active", true),
    admin.from("open_slots").select("id").eq("business_id", businessId),
    admin
      .from("audit_events")
      .select("id", { count: "exact", head: true })
      .eq("business_id", businessId)
      .eq("event_type", "offers_no_match")
      .gte("created_at", since7d),
    buildDailyOpsSummary(admin, businessId),
  ]);

  if (locRes.error || provRes.error || svcRes.error) {
    throw new Error("recovery_health_setup_counts_failed");
  }

  const locCount = locRes.count ?? 0;
  const provCount = provRes.count ?? 0;
  const svcCount = svcRes.count ?? 0;

  const setupComplete = locCount > 0 && provCount > 0 && svcCount > 0;
  const setupDetails = (() => {
    if (setupComplete) return "Locations, providers, and services are configured.";
    if (locCount === 0) return "Add at least one active location, then provider and service.";
    if (provCount === 0) return "Add at least one active provider so openings can be attributed.";
    if (svcCount === 0) return "Add at least one active service so standby can match openings.";
    return "Complete the missing workspace items.";
  })();
  const setupSignal: RecoveryHealthSignal = setupComplete
    ? {
        status: "ready",
        label: "Workspace setup",
        value: "Ready",
        details: setupDetails,
      }
    : {
        status: "setup_required",
        label: "Workspace setup",
        value: "Needs setup",
        details: setupDetails,
      };

  if (prefsRes.error) throw new Error("recovery_health_standby_failed");
  const standbyCustomerIds = [
    ...new Set((prefsRes.data ?? []).map((r) => String((r as { customer_id: string }).customer_id))),
  ];
  const standbyCount = standbyCustomerIds.length;

  let reachableCount = 0;
  if (standbyCount > 0) {
    const [{ data: custRows, error: cErr }, { data: deviceRows, error: dErr }] = await Promise.all([
      admin
        .from("customers")
        .select("id, push_enabled, email_enabled, sms_enabled")
        .in("id", standbyCustomerIds),
      admin
        .from("customer_push_devices")
        .select("customer_id")
        .in("customer_id", standbyCustomerIds)
        .eq("active", true)
        .eq("platform", "ios")
        .eq("token_type", "apns"),
    ]);
    if (cErr || dErr) throw new Error("recovery_health_reach_failed");

    const withDevice = new Set(
      (deviceRows ?? []).map((r) => String((r as { customer_id: string }).customer_id)),
    );

    for (const row of custRows ?? []) {
      const c = row as {
        id: string;
        push_enabled?: boolean | null;
        email_enabled?: boolean | null;
        sms_enabled?: boolean | null;
      };
      const emailOk = Boolean(c.email_enabled);
      const smsOk = Boolean(c.sms_enabled);
      const pushOk = Boolean(c.push_enabled) && withDevice.has(c.id);
      if (emailOk || smsOk || pushOk) reachableCount += 1;
    }
  }

  const standbySignal: RecoveryHealthSignal =
    standbyCount === 0
      ? {
          status: "low_coverage",
          label: "Standby pool",
          value: "0 active",
          details: "No customers have active standby preferences for this business yet.",
        }
      : standbyCount < STANDBY_LOW_CUSTOMERS
        ? {
            status: "low_coverage",
            label: "Standby pool",
            value: `${standbyCount} active`,
            details: "Customers with active standby preferences — pool is still thin for reliable matching.",
          }
        : {
            status: "ready",
            label: "Standby pool",
            value: `${standbyCount} active`,
            details: "Customers with active standby preferences.",
          };

  const reachRatio = standbyCount > 0 ? reachableCount / standbyCount : 0;
  const readinessFixes = computeRecoveryReadinessFixes({
    setupComplete,
    locCount,
    provCount,
    svcCount,
    standbyCount,
    reachableCount,
    reachRatio,
  });

  const notificationReachSignal: RecoveryHealthSignal =
    standbyCount === 0
      ? {
          status: "low_coverage",
          label: "Notification reach",
          value: "—",
          details: "Standby customers determine notification reach — grow the pool to improve reach.",
        }
      : reachableCount === 0
        ? {
            status: "needs_attention",
            label: "Notification reach",
            value: "0 reachable",
            details: "Standby customers need at least one reachable channel (push with device, email, or SMS).",
          }
        : reachRatio < 0.5
          ? {
              status: "low_coverage",
              label: "Notification reach",
              value: `${reachableCount} reachable`,
              details: "Many standby customers are missing a reachable notification channel.",
            }
          : {
              status: "ready",
              label: "Notification reach",
              value: `${reachableCount} reachable`,
              details: "Customers with active standby and a reachable push or contact channel.",
            };

  const slotIds = (slotIdsRes.data ?? []).map((r) => String((r as { id: string }).id));
  if (slotIdsRes.error) throw new Error("recovery_health_slots_failed");

  let offersSent7d = 0;
  if (slotIds.length > 0) {
    const { count, error: oErr } = await admin
      .from("slot_offers")
      .select("id", { count: "exact", head: true })
      .in("open_slot_id", slotIds)
      .gte("sent_at", since7d);
    if (oErr) throw new Error("recovery_health_offers_failed");
    offersSent7d = count ?? 0;
  }

  const { count: confirmedCountRaw, error: confErr } = await admin
    .from("slot_claims")
    .select("id, open_slots!inner(business_id)", { count: "exact", head: true })
    .eq("status", "confirmed")
    .not("confirmed_at", "is", null)
    .gte("confirmed_at", since30d)
    .eq("open_slots.business_id", businessId);

  if (confErr) throw new Error("recovery_health_confirmed_failed");
  const confirmedCount = confirmedCountRaw ?? 0;

  const noMatches7d = noMatchRes.count ?? 0;
  if (noMatchRes.error) throw new Error("recovery_health_no_match_failed");

  const recentMatchingSignal: RecoveryHealthSignal =
    offersSent7d === 0
      ? {
          status: "low_coverage",
          label: "Recent matching",
          value: "No offers sent",
          details: "No offers were sent in the last week — create openings and send offers when cancellations land.",
        }
      : noMatches7d >= NO_MATCH_HEAVY
        ? {
            status: "needs_attention",
            label: "Recent matching",
            value: `${offersSent7d} offers sent`,
            details: `${noMatches7d} no-match events in the last week — review services, standby coverage, or invite more customers.`,
          }
        : {
            status: "ready",
            label: "Recent matching",
            value: `${offersSent7d} offers sent`,
            details: "Recent openings are reaching matched customers.",
          };

  const waitingClaims = dailyOps.metrics.awaiting_confirmation_count;

  const claimsSignal: RecoveryHealthSignal =
    waitingClaims > 0
      ? {
          status: "needs_attention",
          label: "Claims",
          value: `${waitingClaims} waiting`,
          details: "Claims waiting for clinic confirmation.",
        }
      : {
          status: "ready",
          label: "Claims",
          value: `${confirmedCount} confirmed (30d)`,
          details: "No claims waiting for confirmation.",
        };

  const deliveryFailuresToday = dailyOps.metrics.delivery_failures_today;

  const nextActions: RecoveryHealthNextAction[] = [];
  if (!setupComplete) {
    if (locCount === 0) nextActions.push({ label: "Add a location", href: "/locations", priority: "primary" });
    if (provCount === 0) nextActions.push({ label: "Add a provider", href: "/providers", priority: "primary" });
    if (svcCount === 0) nextActions.push({ label: "Add a service", href: "/services", priority: "primary" });
  } else if (standbyCount < STANDBY_LOW_CUSTOMERS) {
    nextActions.push({ label: "Invite customers", href: "/customers#invite-customer", priority: "primary" });
  } else if (reachableCount < standbyCount && standbyCount > 0) {
    nextActions.push({ label: "Review standby customers", href: "/customers", priority: "secondary" });
  }
  if (waitingClaims > 0) {
    /** Secondary so Command Center NBA can stay the primary “do this now” for claims. */
    nextActions.push({ label: "Review claims", href: "/claims", priority: "secondary" });
  } else if (deliveryFailuresToday > 0) {
    nextActions.push({ label: "Review delivery on openings", href: "/open-slots", priority: "primary" });
  } else if (offersSent7d === 0 && setupComplete) {
    nextActions.push({ label: "Create an opening", href: "/open-slots/create", priority: "secondary" });
  }

  const dedupedActions = dedupeNextActions(nextActions).slice(0, 3);

  let overall: RecoveryHealthOverallStatus = "ready";
  let headline = "Recovery system ready";
  let message =
    "PulseFill has the setup, standby coverage, and notification reach needed to recover openings when cancellations happen.";

  if (!setupComplete) {
    overall = "setup_required";
    headline = "Workspace setup required";
    message =
      "Add locations, providers, and services so openings can match to the right standby customers.";
  } else if (standbyCount < STANDBY_LOW_CUSTOMERS) {
    overall = "low_coverage";
    headline = "Low standby coverage";
    message = "Invite more customers to standby so cancellations have a stronger pool to match against.";
  } else if (reachableCount === 0 || reachRatio < 0.5) {
    overall = reachableCount === 0 ? "needs_attention" : "low_coverage";
    headline = reachableCount === 0 ? "Notification reach needs attention" : "Notification reach is thin";
    message =
      reachableCount === 0
        ? "Standby customers are not reachable yet — confirm push devices or email/SMS preferences."
        : "Many standby customers still need a reachable channel so alerts can land.";
  } else if (waitingClaims > 0 || deliveryFailuresToday > 0 || noMatches7d >= NO_MATCH_HEAVY) {
    overall = "needs_attention";
    headline = "Recovery needs attention";
    message = "There are open items in matching, delivery, or confirmations that deserve a quick review.";
  } else if (offersSent7d === 0) {
    overall = "low_coverage";
    headline = "Quiet matching week";
    message = "No offers were sent recently — when cancellations land, create openings and send offers to stay ahead.";
  }

  const evaluatedAt = new Date().toISOString();

  return {
    evaluated_at: evaluatedAt,
    status: overall,
    headline,
    message,
    readiness: { fixes: readinessFixes.slice(0, 5) },
    signals: {
      setup: setupSignal,
      standby_pool: standbySignal,
      notification_reach: notificationReachSignal,
      recent_matching: recentMatchingSignal,
      claims: claimsSignal,
    },
    next_actions: dedupedActions,
  };
}

function dedupeNextActions(actions: RecoveryHealthNextAction[]): RecoveryHealthNextAction[] {
  const seen = new Set<string>();
  const out: RecoveryHealthNextAction[] = [];
  for (const a of actions) {
    const k = `${a.href}|${a.label}`;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(a);
  }
  return out;
}
