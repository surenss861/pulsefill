import { PageState } from "@/components/ui/page-state";

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
    <PageState
      variant="empty"
      title="No activity yet"
      description="Activity appears after you create openings, send offers, or confirm bookings."
    />
  );
}
