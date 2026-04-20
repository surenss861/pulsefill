import type { SupabaseClient } from "@supabase/supabase-js";
import { buildActionQueue } from "./action-queue.js";

export type MorningRecoveryDigestSectionKind =
  | "work_first"
  | "manual_follow_up"
  | "improve_coverage"
  | "later_today";

export type MorningRecoveryDigestActionType = "bulk_retry_offers" | "bulk_expire" | "open_filtered_slots";

export type MorningRecoveryDigestSection = {
  kind: MorningRecoveryDigestSectionKind;
  title: string;
  detail: string;
  count: number;
  slot_ids: string[];
  priority: "high" | "medium" | "low";
  action_type?: MorningRecoveryDigestActionType;
  action_label?: string;
};

export type MorningRecoveryDigestSummary = {
  retry_now_count: number;
  quiet_hours_ready_count: number;
  manual_follow_up_count: number;
  expand_match_pool_count: number;
};

export type MorningRecoveryDigestResponse = {
  generated_at: string;
  summary: MorningRecoveryDigestSummary;
  sections: MorningRecoveryDigestSection[];
};

function uniq(ids: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const id of ids) {
    if (seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
}

/**
 * Operator “morning recovery” briefing derived from the live action queue.
 * Section CTAs map to existing bulk actions (retry) or open-slots review (deep link).
 */
export async function buildMorningRecoveryDigest(
  admin: SupabaseClient,
  businessId: string,
): Promise<MorningRecoveryDigestResponse> {
  const queue = await buildActionQueue(admin, businessId);
  const needs = queue.sections.needs_action;
  const review = queue.sections.review;

  const retryRecommended = needs.filter((i) => i.kind === "retry_recommended");
  const deliveryFailed = needs.filter((i) => i.kind === "delivery_failed");
  const noMatches = review.filter((i) => i.kind === "no_matches");
  const offeredActive = review.filter((i) => i.kind === "offered_active");

  const workFirstIds = uniq(retryRecommended.map((i) => i.open_slot_id));
  const manualIds = uniq(deliveryFailed.map((i) => i.open_slot_id));
  const improveIds = uniq(noMatches.map((i) => i.open_slot_id));
  const laterIds = uniq(offeredActive.map((i) => i.open_slot_id));

  const summary: MorningRecoveryDigestSummary = {
    retry_now_count: workFirstIds.length,
    quiet_hours_ready_count: laterIds.length,
    manual_follow_up_count: manualIds.length,
    expand_match_pool_count: improveIds.length,
  };

  const sections: MorningRecoveryDigestSection[] = [];

  if (workFirstIds.length > 0) {
    sections.push({
      kind: "work_first",
      title: "Work first",
      detail: "These openings are active and likely benefit from a fresh offer retry right now.",
      count: workFirstIds.length,
      slot_ids: workFirstIds,
      priority: "high",
      action_type: "bulk_retry_offers",
      action_label: "Retry all",
    });
  }

  if (manualIds.length > 0) {
    sections.push({
      kind: "manual_follow_up",
      title: "Manual follow-up",
      detail: "Digital delivery failed for at least one offer. Review logs and decide whether to retry or reach out manually.",
      count: manualIds.length,
      slot_ids: manualIds,
      priority: "high",
      action_type: "open_filtered_slots",
      action_label: "Review candidates",
    });
  }

  if (improveIds.length > 0) {
    sections.push({
      kind: "improve_coverage",
      title: "Improve coverage",
      detail: "These openings had no standby matches. Consider widening preferences or adjusting the slot.",
      count: improveIds.length,
      slot_ids: improveIds,
      priority: "medium",
      action_type: "open_filtered_slots",
      action_label: "Review slots",
    });
  }

  if (laterIds.length > 0) {
    sections.push({
      kind: "later_today",
      title: "Later today",
      detail: "Offers are live and waiting on customers. Check back for claims before the slot starts.",
      count: laterIds.length,
      slot_ids: laterIds,
      priority: "low",
      action_type: "open_filtered_slots",
      action_label: "Review later",
    });
  }

  return {
    generated_at: new Date().toISOString(),
    summary,
    sections,
  };
}
