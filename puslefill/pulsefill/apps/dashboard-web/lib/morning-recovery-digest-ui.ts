import type { MorningRecoveryDigestActionType } from "@/types/morning-recovery-digest";

export function getDigestActionLabel(actionType?: MorningRecoveryDigestActionType, fallback?: string): string {
  if (fallback) return fallback;
  switch (actionType) {
    case "bulk_retry_offers":
      return "Retry all";
    case "open_filtered_slots":
      return "Review slots";
    case "bulk_expire":
      return "Expire all";
    default:
      return "Open";
  }
}

export function digestSectionBannerTitle(kind: string): string {
  switch (kind) {
    case "work_first":
      return "Work first";
    case "manual_follow_up":
      return "Manual follow-up";
    case "improve_coverage":
      return "Improve coverage";
    case "later_today":
      return "Later today";
    default:
      return "Morning Recovery Digest";
  }
}

export function priorityChipStyle(priority: "high" | "medium" | "low"): { background: string; color: string } {
  switch (priority) {
    case "high":
      return { background: "rgba(251,191,36,0.18)", color: "#fcd34d" };
    case "medium":
      return { background: "rgba(96,165,250,0.16)", color: "#93c5fd" };
    default:
      return { background: "rgba(255,255,255,0.06)", color: "var(--muted)" };
  }
}
