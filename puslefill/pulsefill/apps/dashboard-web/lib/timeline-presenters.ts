import type { SlotTimelineEvent } from "@/types/timeline";

const MILESTONE_TYPES = new Set([
  "open_slot_created",
  "slot_created",
  "offers_sent",
  "offers_no_match",
  "claim_won",
  "slot_confirmed",
  "slot_cancelled",
  "slot_expired",
  "slot_reopened",
  "operator_internal_note_updated",
]);

const NOISE_TYPES = new Set(["notification_delivered", "notification_failed"]);

export function isTimelineMilestone(eventType: string): boolean {
  return MILESTONE_TYPES.has(eventType);
}

export function isTimelineNoise(eventType: string): boolean {
  return NOISE_TYPES.has(eventType);
}

export function labelForTimelineEvent(eventType: string): string {
  switch (eventType) {
    case "open_slot_created":
    case "slot_created":
      return "Slot created";
    case "offers_sent":
      return "Offers sent to standby customers";
    case "offers_no_match":
      return "No matching standby customers";
    case "slot_reopened":
      return "Slot reopened";
    case "slot_expired":
      return "Slot expired";
    case "slot_cancelled":
      return "Slot cancelled";
    case "slot_confirmed":
      return "Booking confirmed";
    case "claim_won":
      return "Customer claimed this opening";
    case "notification_delivered":
      return "Push / notification delivered";
    case "notification_failed":
      return "Notification delivery failed";
    case "operator_internal_note_updated":
      return "Internal note updated";
    default:
      return eventType.replace(/_/g, " ");
  }
}

export function formatActorLine(
  actorType: string,
  actorId?: string | null,
  actorLabel?: string | null,
): string {
  const trimmed = actorLabel?.trim();
  if (trimmed) return trimmed;
  const t = actorType.toLowerCase();
  if (t === "staff") return actorId ? `Staff · ${String(actorId).slice(0, 8)}…` : "Staff";
  if (t === "system") return "System";
  if (t === "customer") return "Customer";
  if (actorId) return `${actorType} · ${String(actorId).slice(0, 8)}…`;
  return actorType;
}

/** One-line summary when metadata is meaningful; avoids raw JSON for operators. */
export function summarizeTimelineMetadata(eventType: string, metadata?: Record<string, unknown> | null): string | null {
  if (!metadata || Object.keys(metadata).length === 0) return null;

  if (eventType === "offers_sent") {
    const count = metadata.count;
    const queued = metadata.queued;
    const parts: string[] = [];
    if (typeof count === "number") parts.push(`${count} offer${count === 1 ? "" : "s"}`);
    if (typeof queued === "boolean") parts.push(queued ? "notifications queued" : "queue not used");
    return parts.length ? parts.join(" · ") : null;
  }

  if (eventType === "notification_failed" || eventType === "notification_delivered") {
    const reason = typeof metadata.reason === "string" ? metadata.reason.replace(/_/g, " ") : null;
    return reason ?? null;
  }

  return null;
}

export function sortTimelineForStory(events: SlotTimelineEvent[]): SlotTimelineEvent[] {
  return [...events].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export function pickLatestMilestone(events: SlotTimelineEvent[]): SlotTimelineEvent | null {
  const sorted = sortTimelineForStory(events);
  for (const e of sorted) {
    if (isTimelineMilestone(e.event_type)) return e;
  }
  return sorted[0] ?? null;
}
