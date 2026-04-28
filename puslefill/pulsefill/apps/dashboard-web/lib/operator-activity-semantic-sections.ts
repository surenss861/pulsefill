import type { OperatorActivityItem, OperatorActivityKind } from "@/types/operator-activity-feed";

export type OperatorActivitySemanticKey = "needs_review" | "resolved" | "system_updates";

export type OperatorActivitySemanticSection = {
  key: OperatorActivitySemanticKey;
  label: string;
  title: string;
  body: string;
  items: OperatorActivityItem[];
};

const NEEDS_REVIEW: OperatorActivityKind[] = ["delivery_failed", "offers_no_match", "claim_received"];
const RESOLVED: OperatorActivityKind[] = ["booking_confirmed", "slot_expired", "slot_cancelled"];
const SYSTEM: OperatorActivityKind[] = [
  "offers_sent",
  "offers_retry_sent",
  "internal_note_updated",
  "recovery_feedback_added",
];

function bucketForKind(kind: OperatorActivityKind): OperatorActivitySemanticKey {
  if (NEEDS_REVIEW.includes(kind)) return "needs_review";
  if (RESOLVED.includes(kind)) return "resolved";
  return "system_updates";
}

/** Stable semantic buckets for the activity feed (order: review → outcomes → system). */
export function buildOperatorActivitySemanticSections(items: OperatorActivityItem[]): OperatorActivitySemanticSection[] {
  const needs = items.filter((i) => bucketForKind(i.kind) === "needs_review");
  const resolved = items.filter((i) => bucketForKind(i.kind) === "resolved");
  const system = items.filter((i) => bucketForKind(i.kind) === "system_updates");

  return [
    {
      key: "needs_review",
      label: "Needs review",
      title: "Items that may need follow-up",
      body: "Recent changes that are unresolved, have delivery issues, or still need action.",
      items: needs,
    },
    {
      key: "resolved",
      label: "Recovered / resolved",
      title: "Recent recoveries and closed outcomes",
      body: "Openings that were successfully recovered or otherwise resolved recently.",
      items: resolved,
    },
    {
      key: "system_updates",
      label: "Notes and updates",
      title: "Notes, retries, and workflow changes",
      body: "Supporting activity that helps explain how an opening moved through recovery.",
      items: system,
    },
  ];
}
