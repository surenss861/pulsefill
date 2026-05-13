"use client";

import Link from "next/link";
import { MotionAction } from "@/components/operator/operator-motion-primitives";

type ActivityEmptySectionProps = {
  variant?: "section" | "filtered";
};

export function ActivityEmptySection({ variant = "section" }: ActivityEmptySectionProps) {
  if (variant === "filtered") {
    return (
      <p className="pf-muted-copy" style={{ margin: 0, fontSize: 14, lineHeight: 1.55 }}>
        No activity matches this filter. Try another filter or refresh to check for new events.
      </p>
    );
  }

  return (
    <div className="pf-activity-desk-empty">
      <p style={{ margin: 0, fontSize: 15, lineHeight: 1.55, color: "var(--pf-text-primary)" }}>
        <span style={{ fontWeight: 650 }}>No activity yet</span>
        <span className="pf-muted-copy" style={{ fontWeight: 400 }}>
          {" "}
          — Openings, offers, claims, and confirmations will show here.
        </span>
      </p>
      <MotionAction style={{ marginTop: 14 }}>
        <Link href="/open-slots/create" className="pf-desk-save-access pf-desk-save-access--link">
          Create opening
        </Link>
      </MotionAction>
      <Link href="/open-slots" className="pf-desk-quiet-link" style={{ display: "inline-block", marginTop: 12, fontSize: 13 }}>
        View openings
      </Link>
      <details className="pf-overview-edu" style={{ marginTop: 16 }}>
        <summary>What shows up here?</summary>
        <p className="pf-overview-edu__body">
          Openings, offers, claims, confirmations, delivery attempts, and staff notes appear in order so your team can see what happened.
        </p>
      </details>
    </div>
  );
}
