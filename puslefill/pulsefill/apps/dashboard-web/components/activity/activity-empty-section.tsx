import Link from "next/link";
import { OperatorEmptyState } from "@/components/operator/operator-empty-state";
import { PageState } from "@/components/ui/page-state";
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
    <OperatorEmptyState
      title="No recovery activity yet"
      description="Create an opening, send offers, or confirm a booking to start building history."
      primaryAction={
        <>
          <Link href="/open-slots/create" style={{ ...actionLinkStyle("primary"), marginRight: 10 }}>
            Create opening
          </Link>
          <Link href="/open-slots" style={actionLinkStyle("secondary")}>
            View openings
          </Link>
        </>
      }
    />
  );
}
