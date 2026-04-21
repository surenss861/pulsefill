/**
 * Rules-only operator slot logic: queue classification, action hints, and action validation.
 * No DB access — callers assemble `SlotRuleSignals` from loaded rows.
 */

export type SlotLifecycleStatus =
  | "open"
  | "offered"
  | "claimed"
  | "booked"
  | "expired"
  | "cancelled";

export type ClaimRuleStatus = "pending" | "won" | "lost" | "confirmed" | "failed";

export type SlotRuleSignals = {
  slotStatus: SlotLifecycleStatus;
  hasWinningClaim: boolean;
  claimStatus: ClaimRuleStatus | null;
  hasActiveOffers: boolean;
  hasOfferHistory: boolean;
  lastOfferBatchAt: string | null;
  /** True when the latest relevant notification attempt failed (e.g. notification_logs). */
  hasFailedDelivery: boolean;
  /** Raw error text from the failed delivery row, when present. */
  deliveryFailureError: string | null;
  hasNoMatchAudit: boolean;
  createdAt: string;
  nowIso: string;
  resolutionStatus: string | null;
};

export type QueueCategory =
  | "awaiting_confirmation"
  | "delivery_failed"
  | "retry_recommended"
  | "no_matches"
  | "offered_active"
  | "expired_unfilled"
  | "confirmed_booking";

export type QueueSection = "needs_action" | "review" | "resolved";

export type QueueSeverity = "high" | "medium" | "low";

export type OperatorSlotAvailableAction =
  | "confirm_booking"
  | "retry_offers"
  | "send_offers"
  | "expire_slot"
  | "cancel_slot"
  | "add_note"
  | "inspect_notification_logs";

export type OperatorSlotQueueContext = {
  current_category: QueueCategory | null;
  current_section: QueueSection | null;
  reason_title: string | null;
  reason_detail: string | null;
  severity: QueueSeverity | null;
};

export function isWithinLastDays(createdAtIso: string, nowIso: string, days: number): boolean {
  const start = Date.parse(createdAtIso);
  const end = Date.parse(nowIso);
  if (Number.isNaN(start) || Number.isNaN(end)) return false;
  return end - start <= days * 24 * 60 * 60 * 1000;
}

function hasLiveOffers(
  offers: Array<{ status: string; expires_at: string }>,
  nowMs: number,
): boolean {
  return offers.some((o) => {
    if (!["sent", "delivered", "viewed"].includes(o.status)) return false;
    return new Date(o.expires_at).getTime() > nowMs;
  });
}

type CategoryRuleRow = {
  category: QueueCategory;
  when: (s: SlotRuleSignals) => boolean;
  section: QueueSection;
  severity: QueueSeverity;
  reasonTitle: string;
  reasonDetail: string | ((s: SlotRuleSignals) => string);
};

/** First matching row wins (same priority contract as the action queue). */
const QUEUE_CATEGORY_RULES: CategoryRuleRow[] = [
  {
    category: "awaiting_confirmation",
    when: (s) =>
      s.slotStatus === "claimed" &&
      s.hasWinningClaim &&
      (s.claimStatus === "won" || s.claimStatus === "pending"),
    section: "needs_action",
    severity: "high",
    reasonTitle: "Awaiting confirmation",
    reasonDetail: "A patient claimed this slot and staff confirmation is still needed.",
  },
  {
    category: "delivery_failed",
    when: (s) =>
      (s.slotStatus === "open" || s.slotStatus === "offered") && s.hasFailedDelivery,
    section: "needs_action",
    severity: "high",
    reasonTitle: "Delivery failed",
    reasonDetail: (s) => {
      const err = s.deliveryFailureError?.trim();
      if (!err) return "Offer delivery did not complete successfully. Review before retrying.";
      return `Last failure: ${err.slice(0, 160)}${err.length > 160 ? "…" : ""}`;
    },
  },
  {
    category: "retry_recommended",
    when: (s) =>
      (s.slotStatus === "open" || s.slotStatus === "offered") &&
      !s.hasActiveOffers &&
      s.hasOfferHistory &&
      !s.hasFailedDelivery &&
      !s.hasNoMatchAudit,
    section: "needs_action",
    severity: "medium",
    reasonTitle: "Retry recommended",
    reasonDetail: "A prior offer batch exists and this slot may still be recoverable.",
  },
  {
    category: "no_matches",
    when: (s) =>
      (s.slotStatus === "open" || s.slotStatus === "offered") && s.hasNoMatchAudit,
    section: "needs_action",
    severity: "medium",
    reasonTitle: "No matches found",
    reasonDetail: "No eligible standby patients were found for this opening.",
  },
  {
    category: "offered_active",
    when: (s) => s.slotStatus === "offered" && s.hasActiveOffers,
    section: "review",
    severity: "low",
    reasonTitle: "Offers still active",
    reasonDetail: "A live offer batch is still in flight. Review before retrying.",
  },
  {
    category: "expired_unfilled",
    when: (s) => s.slotStatus === "expired",
    section: "review",
    severity: "medium",
    reasonTitle: "Expired unfilled",
    reasonDetail: "This slot expired without a confirmed recovery.",
  },
  {
    category: "confirmed_booking",
    when: (s) => s.slotStatus === "booked" && isWithinLastDays(s.createdAt, s.nowIso, 7),
    section: "resolved",
    severity: "low",
    reasonTitle: "Recovered booking",
    reasonDetail: "This slot was recently recovered and confirmed.",
  },
];

export function buildQueueContext(signals: SlotRuleSignals): OperatorSlotQueueContext {
  const matched = QUEUE_CATEGORY_RULES.find((rule) => rule.when(signals));
  if (!matched) {
    return {
      current_category: null,
      current_section: null,
      reason_title: null,
      reason_detail: null,
      severity: null,
    };
  }
  const detail =
    typeof matched.reasonDetail === "function" ? matched.reasonDetail(signals) : matched.reasonDetail;
  return {
    current_category: matched.category,
    current_section: matched.section,
    reason_title: matched.reasonTitle,
    reason_detail: detail,
    severity: matched.severity,
  };
}

type ActionRuleRow = {
  when: (s: SlotRuleSignals, q: OperatorSlotQueueContext) => boolean;
  actions: OperatorSlotAvailableAction[];
};

const ACTION_RULES: ActionRuleRow[] = [
  {
    when: (_s, q) => q.current_category === "awaiting_confirmation",
    actions: ["confirm_booking", "add_note", "inspect_notification_logs", "cancel_slot"],
  },
  {
    when: (_s, q) => q.current_category === "offered_active",
    actions: ["inspect_notification_logs", "expire_slot", "cancel_slot", "add_note"],
  },
  {
    when: (s, q) =>
      (q.current_category === "delivery_failed" ||
        q.current_category === "retry_recommended" ||
        q.current_category === "no_matches") &&
      (s.slotStatus === "open" || s.slotStatus === "offered"),
    actions: ["retry_offers", "expire_slot", "cancel_slot", "add_note", "inspect_notification_logs"],
  },
  {
    when: (s, q) =>
      q.current_category === null && s.slotStatus === "open" && !s.hasOfferHistory,
    actions: ["send_offers", "expire_slot", "cancel_slot", "add_note", "inspect_notification_logs"],
  },
  {
    when: (s, q) =>
      q.current_category === null &&
      (s.slotStatus === "open" || s.slotStatus === "offered") &&
      s.hasOfferHistory,
    actions: ["retry_offers", "expire_slot", "cancel_slot", "add_note", "inspect_notification_logs"],
  },
  {
    when: (s, q) => q.current_category === null && s.slotStatus === "claimed",
    actions: ["add_note", "inspect_notification_logs", "cancel_slot"],
  },
  {
    when: (s) => s.slotStatus === "booked" || s.slotStatus === "expired",
    actions: ["add_note", "inspect_notification_logs"],
  },
  {
    when: (s) => s.slotStatus === "cancelled",
    actions: ["add_note", "inspect_notification_logs"],
  },
];

const ACTION_ORDER: OperatorSlotAvailableAction[] = [
  "confirm_booking",
  "send_offers",
  "retry_offers",
  "expire_slot",
  "cancel_slot",
  "add_note",
  "inspect_notification_logs",
];

export function buildAvailableActions(
  signals: SlotRuleSignals,
  queueContext: OperatorSlotQueueContext,
): OperatorSlotAvailableAction[] {
  const matched = ACTION_RULES.find((rule) => rule.when(signals, queueContext));
  const raw = matched?.actions ?? (["add_note", "inspect_notification_logs"] as const);
  const seen = new Set<OperatorSlotAvailableAction>();
  const ordered: OperatorSlotAvailableAction[] = [];
  for (const key of ACTION_ORDER) {
    if (raw.includes(key) && !seen.has(key)) {
      seen.add(key);
      ordered.push(key);
    }
  }
  return ordered;
}

export function canPerformAction(action: OperatorSlotAvailableAction, signals: SlotRuleSignals): boolean {
  const validators: Record<OperatorSlotAvailableAction, (s: SlotRuleSignals) => boolean> = {
    confirm_booking: (s) =>
      s.slotStatus === "claimed" &&
      s.hasWinningClaim &&
      (s.claimStatus === "won" || s.claimStatus === "pending"),

    /** Must stay aligned with `offered_active` queue category: no retry while a live batch is in flight. */
    retry_offers: (s) =>
      (s.slotStatus === "open" || s.slotStatus === "offered") &&
      !claimBlocksOffers(s) &&
      !(s.slotStatus === "offered" && s.hasActiveOffers),

    send_offers: (s) => s.slotStatus === "open" && !s.hasOfferHistory && !claimBlocksOffers(s),

    expire_slot: (s) => s.slotStatus === "open" || s.slotStatus === "offered",

    cancel_slot: (s) =>
      s.slotStatus === "open" || s.slotStatus === "offered" || s.slotStatus === "claimed",

    add_note: () => true,

    inspect_notification_logs: () => true,
  };
  return validators[action]?.(signals) ?? false;
}

function claimBlocksOffers(s: SlotRuleSignals): boolean {
  return (
    s.slotStatus === "claimed" &&
    s.hasWinningClaim &&
    (s.claimStatus === "won" || s.claimStatus === "pending")
  );
}

export type SlotRuleSignalsInput = {
  slotStatus: string;
  createdAt: string;
  nowMs: number;
  offers: Array<{ status: string; expires_at: string }>;
  claims: Array<{ status: string }>;
  lastOfferBatchAt: string | null;
  latestFailedNotification: { error: string | null } | null;
  hasRecentNoMatchAudit: boolean;
  resolutionStatus?: string | null;
};

const LIFECYCLE: SlotLifecycleStatus[] = [
  "open",
  "offered",
  "claimed",
  "booked",
  "expired",
  "cancelled",
];

function normalizeLifecycle(status: string): SlotLifecycleStatus {
  const s = String(status || "").toLowerCase();
  return (LIFECYCLE.includes(s as SlotLifecycleStatus) ? s : "open") as SlotLifecycleStatus;
}

function normalizeClaimStatus(status: string): ClaimRuleStatus | null {
  const s = String(status || "").toLowerCase();
  if (s === "pending" || s === "won" || s === "lost" || s === "confirmed" || s === "failed") {
    return s as ClaimRuleStatus;
  }
  return null;
}

/**
 * Normalizes raw slot + offer + claim + audit inputs into `SlotRuleSignals`.
 */
export function toSlotRuleSignals(input: SlotRuleSignalsInput): SlotRuleSignals {
  const slotStatus = normalizeLifecycle(input.slotStatus);
  const nowIso = new Date(input.nowMs).toISOString();
  const won = input.claims.find((c) => normalizeClaimStatus(c.status) === "won");
  const pending = input.claims.find((c) => normalizeClaimStatus(c.status) === "pending");
  const primary = won ?? pending;
  const claimStatus = primary ? normalizeClaimStatus(primary.status) : null;
  const hasWinningClaim = Boolean(primary && (claimStatus === "won" || claimStatus === "pending"));

  const hasActiveOffers = hasLiveOffers(input.offers, input.nowMs);
  const hasOfferHistory = input.offers.length > 0 || Boolean(input.lastOfferBatchAt);
  const hasFailedDelivery = Boolean(input.latestFailedNotification);
  const deliveryFailureError = input.latestFailedNotification?.error?.trim() || null;

  return {
    slotStatus,
    hasWinningClaim,
    claimStatus,
    hasActiveOffers,
    hasOfferHistory,
    lastOfferBatchAt: input.lastOfferBatchAt,
    hasFailedDelivery,
    deliveryFailureError,
    hasNoMatchAudit: input.hasRecentNoMatchAudit,
    createdAt: input.createdAt,
    nowIso,
    resolutionStatus: input.resolutionStatus ?? null,
  };
}
