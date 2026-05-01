"use client";

import Link from "next/link";
import { OperatorEmptyState } from "@/components/operator/operator-empty-state";
import { PageState } from "@/components/ui/page-state";
import { MotionAction } from "@/components/operator/operator-motion-primitives";
import { actionLinkStyle } from "@/lib/operator-action-link-styles";

type ActivityEmptySectionProps = {
  variant?: "section" | "filtered";
};

export function ActivityEmptySection({ variant = "section" }: ActivityEmptySectionProps) {
  if (variant === "filtered") {
    return (
      <PageState
        variant="empty"
        title="No activity for this filter"
        description="Try another filter or refresh to check for new workflow events."
      />
    );
  }
  return (
    <div className="pf-activity-empty-timeline">
      <div className="pf-activity-empty-timeline__spine" aria-hidden />
      <div className="pf-activity-empty-timeline__body">
        <OperatorEmptyState
          title="No recovery activity yet"
          description="Create an opening, send offers, or confirm a booking to start building your recovery log."
          primaryAction={
            <>
              <MotionAction>
                <Link href="/open-slots/create" style={{ ...actionLinkStyle("primary"), marginRight: 10 }}>
                  Create opening
                </Link>
              </MotionAction>
              <MotionAction>
                <Link href="/open-slots" style={actionLinkStyle("secondary")}>
                  View openings
                </Link>
              </MotionAction>
            </>
          }
          secondaryContent={
            <details className="pf-overview-edu" style={{ marginTop: 4 }}>
              <summary>What gets logged?</summary>
              <p className="pf-overview-edu__body">
                Openings, offers, claims, confirmations, internal notes, and delivery attempts appear here as they happen so your team has a
                single timeline to audit recovery.
              </p>
            </details>
          }
        />
      </div>
    </div>
  );
}
