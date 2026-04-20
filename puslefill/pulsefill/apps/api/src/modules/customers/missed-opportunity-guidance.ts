export type GuidanceTone = "action" | "neutral";

export type MissedGuidance = { code: string; title: string; tone: GuidanceTone };

export function guidanceForReason(reasonCode: string): MissedGuidance[] {
  switch (reasonCode) {
    case "claimed_by_someone_else":
      return [
        { code: "enable_push", title: "Turn on push notifications", tone: "action" },
        { code: "react_faster", title: "Claim quickly when you get the next alert", tone: "neutral" },
      ];
    case "expired_before_action":
      return [
        { code: "enable_push", title: "Turn on push notifications", tone: "action" },
        { code: "widen_window", title: "Expand your availability window if you can", tone: "neutral" },
      ];
    case "notifications_not_ready":
      return [{ code: "enable_push", title: "Turn on push notifications", tone: "action" }];
    case "preference_inactive":
      return [{ code: "reactivate_pref", title: "Reactivate this standby preference", tone: "action" }];
    default:
      return [{ code: "keep_standby", title: "Keep standby on for the next opening", tone: "neutral" }];
  }
}
