import Link from "next/link";
import { PageIntroCard } from "@/components/ui/page-intro-card";
import { actionLinkStyle } from "@/components/ui/action-button";

type OutcomesHeroProps = {
  windowLabel?: string;
};

export function OutcomesHero({ windowLabel }: OutcomesHeroProps) {
  const badgeText = windowLabel?.trim() || "Last 24 hours";
  const badge = (
    <span
      style={{
        borderRadius: 999,
        border: "1px solid var(--pf-border-default)",
        background: "rgba(255,255,255,0.03)",
        padding: "8px 14px",
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: "0.18em",
        textTransform: "uppercase",
        color: "rgba(245, 247, 250, 0.52)",
      }}
    >
      {badgeText}
    </span>
  );

  const actions = (
    <Link href="/action-queue?section=needs_action" style={actionLinkStyle("primary")}>
      Open queue
    </Link>
  );

  return (
    <PageIntroCard
      overline="Outcomes"
      title="Recovery proof."
      description="See what the team recovered, what was lost, and where the workflow is leaking so action stays tied to measurable outcomes."
      badge={badge}
      actions={actions}
    />
  );
}
