import Link from "next/link";
import { PageIntroCard } from "@/components/ui/page-intro-card";
import { actionLinkStyle } from "@/components/ui/action-button";

type OverviewOperatorHeroProps = {
  urgentOpeningsCount: number;
  secondaryHref: string;
  secondaryLabel: string;
};

export function OverviewOperatorHero({
  urgentOpeningsCount,
  secondaryHref,
  secondaryLabel,
}: OverviewOperatorHeroProps) {
  const hasUrgent = urgentOpeningsCount > 0;

  const actions = (
    <>
      <Link href="/open-slots/create" style={actionLinkStyle("primary")}>
        Create opening
      </Link>
      <Link href={secondaryHref} style={actionLinkStyle("secondary")}>
        {secondaryLabel}
      </Link>
    </>
  );

  return (
    <PageIntroCard
      style={{ marginBottom: 18 }}
      tone="elevated"
      layout="split"
      overline="Command center"
      title="Today's recovery"
      description={
        hasUrgent ? `${urgentOpeningsCount} opening${urgentOpeningsCount === 1 ? "" : "s"} need attention.` : "No urgent openings right now."
      }
      actions={actions}
    />
  );
}
