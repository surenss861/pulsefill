export type StandbyGuidanceTone = "good" | "action" | "warning" | "neutral";

export type StandbyGuidanceItem = {
  code: string;
  title: string;
  tone: StandbyGuidanceTone;
};

export function buildStandbyGuidance(input: {
  activePreferences: number;
  pausedPreferences: number;
  hasPushDevice: boolean;
  pushPermissionStatus: string;
  pushEnabled: boolean;
  hasEmail: boolean;
  hasSms: boolean;
  hasAnyReachableChannel: boolean;
}): StandbyGuidanceItem[] {
  const items: StandbyGuidanceItem[] = [];

  if (!input.hasAnyReachableChannel) {
    items.push({
      code: "unreachable",
      title: "Add a reachable notification channel (push, email, or SMS) so we can alert you.",
      tone: "action",
    });
  }

  const pushBlocked =
    input.pushPermissionStatus === "denied" ||
    !input.pushEnabled ||
    !input.hasPushDevice;

  if (pushBlocked) {
    if (input.pushPermissionStatus === "denied") {
      items.push({
        code: "enable_push_settings",
        title: "Notifications are blocked — enable PulseFill in Settings to get openings faster.",
        tone: "action",
      });
    } else if (!input.hasPushDevice) {
      items.push({
        code: "enable_push",
        title: "Turn on push notifications on this device and open the app once to register.",
        tone: "action",
      });
    } else if (!input.pushEnabled) {
      items.push({
        code: "enable_push_pulsefill",
        title: "Turn on PulseFill notifications in your profile so we can reach you about openings.",
        tone: "action",
      });
    }
  }

  if (input.activePreferences === 0) {
    if (input.pausedPreferences > 0) {
      items.push({
        code: "reactivate_preference",
        title: "Your standby preferences are paused — resume one to receive openings.",
        tone: "action",
      });
    } else {
      items.push({
        code: "activate_preference",
        title: "Add an active standby preference to start receiving openings.",
        tone: "action",
      });
    }
  }

  if (items.length === 0) {
    items.push({
      code: "coverage_active",
      title: "Push and standby coverage look good — we’ll notify you when something matches.",
      tone: "good",
    });
  }

  return items;
}
