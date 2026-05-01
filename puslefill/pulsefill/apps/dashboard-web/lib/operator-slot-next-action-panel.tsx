"use client";

import type { ReactNode } from "react";
import type { OperatorActionPanelPriority } from "@/components/operator/operator-action-panel";
import type { OperatorSlotAvailableAction, OperatorSlotQueueCategory } from "@/types/open-slot-detail";
import { isSlotRecoveryTerminalStatus } from "@/lib/slot-recovery-pipeline";

export type SlotNextActionPresentation = {
  eyebrow: string | null;
  title: string;
  description?: ReactNode;
  priority: OperatorActionPanelPriority;
};

const NO_MATCH_NEXT_STEPS = (
  <>
    <p style={{ margin: "0 0 8px" }}>Next steps</p>
    <ul style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 6 }}>
      <li>Widen opening details (time, service, or provider) if appropriate.</li>
      <li>Invite more standby customers or adjust preferences.</li>
      <li>Review internal notes and timeline for context.</li>
    </ul>
  </>
);

function hasAction(actions: OperatorSlotAvailableAction[], code: OperatorSlotAvailableAction) {
  return actions.includes(code);
}

/** Friendly headline + body for the primary operator decision block on opening detail. */
export function slotNextActionPresentation(args: {
  slotStatus: string;
  queueCategory: OperatorSlotQueueCategory | null;
  availableActions: OperatorSlotAvailableAction[];
}): SlotNextActionPresentation {
  const { slotStatus, queueCategory, availableActions } = args;
  const status = slotStatus.toLowerCase();

  if (isSlotRecoveryTerminalStatus(slotStatus)) {
    if (status === "expired") {
      return {
        eyebrow: "Recovery",
        title: "Opening expired",
        description:
          "This opening expired before a booking was confirmed. Nothing else is required unless you want to add a note for the team.",
        priority: "quiet",
      };
    }
    if (status === "cancelled") {
      return {
        eyebrow: "Recovery",
        title: "Opening cancelled",
        description: "This opening was cancelled. The recovery path is closed for this case.",
        priority: "quiet",
      };
    }
    return {
      eyebrow: "Recovery",
      title: "Opening needs review",
      description:
        "This opening is in a failed state. Review delivery and notes before closing it out with your team’s process.",
      priority: "attention",
    };
  }

  if (status === "booked") {
    return {
      eyebrow: "Recovery",
      title: "Recovered — booking confirmed",
      description: "This opening was filled and the booking is confirmed. No further recovery actions are required.",
      priority: "quiet",
    };
  }

  if (queueCategory === "no_matches") {
    return {
      eyebrow: "Matching",
      title: "No matching standby customers",
      description: (
        <>
          <p style={{ margin: 0 }}>
            PulseFill checked active standby preferences but did not find a customer who fits this opening.
          </p>
          {NO_MATCH_NEXT_STEPS}
        </>
      ),
      priority: "attention",
    };
  }

  if (queueCategory === "delivery_failed" || queueCategory === "retry_recommended") {
    return {
      eyebrow: "Delivery",
      title: "Delivery needs attention",
      description:
        "Some notifications could not be delivered. Review channels or retry sending offers if that option is available.",
      priority: "critical",
    };
  }

  if (hasAction(availableActions, "confirm_booking")) {
    return {
      eyebrow: "Booking",
      title: "Confirm this booking",
      description:
        "A customer claimed this opening. Confirm once the appointment is booked in the clinic calendar.",
      priority: "critical",
    };
  }

  if (hasAction(availableActions, "send_offers")) {
    return {
      eyebrow: "Offers",
      title: "Send offers to standby customers",
      description: "This opening is ready. Send offers so matched standby customers can claim the time.",
      priority: "normal",
    };
  }

  if (hasAction(availableActions, "retry_offers")) {
    return {
      eyebrow: "Offers",
      title: "Retry or refresh offers",
      description:
        "Offers were sent earlier. You can retry if delivery had issues or you want another pass at standby customers.",
      priority: queueCategory === "offered_active" ? "normal" : "attention",
    };
  }

  if (status === "offered" || queueCategory === "offered_active") {
    return {
      eyebrow: "Offers",
      title: "Waiting for claims",
      description:
        "Offers are out. Standby customers can claim this opening; you’ll confirm the booking once someone wins the slot.",
      priority: "normal",
    };
  }

  if (status === "claimed") {
    return {
      eyebrow: "Claim",
      title: "Claim in progress",
      description: "A customer has claimed this opening. Confirm the booking when the appointment is on the calendar.",
      priority: "attention",
    };
  }

  if (status === "open") {
    return {
      eyebrow: "Opening",
      title: "Ready to match",
      description: "This opening is live. When you are ready, send offers to eligible standby customers.",
      priority: "normal",
    };
  }

  return {
    eyebrow: "Opening",
    title: "Operator actions",
    description: "Use the actions below to move this opening forward.",
    priority: "normal",
  };
}
