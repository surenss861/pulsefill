import Link from "next/link";
import { PageCommandHeader } from "@/components/operator/page-command-header";
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

  const primaryAction = claimWaiting ? (
    <Link href="/claims" style={actionLinkStyle("primary")}>
      Review claim
    </Link>
  ) : (
    <Link href="/open-slots/create" style={actionLinkStyle("primary")}>
      Create opening
    </Link>
  );

  const secondaryAction = claimWaiting ? (
    <Link href="/open-slots/create" style={actionLinkStyle("secondary")}>
      Create opening
    </Link>
  ) : (
    <Link href={secondaryHref} style={actionLinkStyle("secondary")}>
      {secondaryLabel}
    </Link>
  );

  const title = claimWaiting ? "Claim needs confirmation" : "Today's recovery";
  const description = claimWaiting
    ? "A customer requested an opening. Confirm once the appointment is booked."
    : hasUrgent
      ? `${urgentOpeningsCount} opening${urgentOpeningsCount === 1 ? "" : "s"} need attention.`
      : "No urgent openings right now.";

  return (
    <PageCommandHeader
      animate={false}
      tone="strong"
      eyebrow="Command Center"
      title={title}
      description={description}
      primaryAction={primaryAction}
      secondaryAction={secondaryAction}
      style={{ marginBottom: 4 }}
    />
  );
}
