import Link from "next/link";
import { PageIntroCard } from "@/components/ui/page-intro-card";
import { actionLinkStyle } from "@/components/ui/action-button";

type OverviewOperatorHeroProps = {
  urgentOpeningsCount: number;
  awaitingConfirmationCount: number;
  secondaryHref: string;
  secondaryLabel: string;
};

export function OverviewOperatorHero({
  urgentOpeningsCount,
  awaitingConfirmationCount,
  secondaryHref,
  secondaryLabel,
}: OverviewOperatorHeroProps) {
  const hasUrgent = urgentOpeningsCount > 0;
  const claimWaiting = awaitingConfirmationCount > 0;

  const actions = claimWaiting ? (
    <>
      <Link href="/claims" style={actionLinkStyle("primary")}>
        Review claim
      </Link>
      <Link href="/open-slots/create" style={actionLinkStyle("secondary")}>
        Create opening
      </Link>
    </>
  ) : (
    <>
      <Link href="/open-slots/create" style={actionLinkStyle("primary")}>
        Create opening
      </Link>
      <Link href={secondaryHref} style={actionLinkStyle("secondary")}>
        {secondaryLabel}
      </Link>
    </>
  );

  const title = claimWaiting ? "Claim needs confirmation" : "Today's recovery";
  const description = claimWaiting
    ? "A customer requested an opening. Confirm once the appointment is booked."
    : hasUrgent
      ? `${urgentOpeningsCount} opening${urgentOpeningsCount === 1 ? "" : "s"} need attention.`
      : "No urgent openings right now.";

  return (
    <PageIntroCard
      style={{ marginBottom: 18 }}
      tone="elevated"
      layout="split"
      overline="Command Center"
      title={title}
      description={description}
      actions={actions}
    />
  );
}
