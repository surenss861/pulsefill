import { PageState } from "@/components/ui/page-state";

type ActivityEmptySectionProps = {
  variant?: "section" | "filtered";
};

export function ActivityEmptySection({ variant = "section" }: ActivityEmptySectionProps) {
  if (variant === "filtered") {
    return (
      <PageState
        variant="empty"
        title="Nothing here"
        description="Try another filter, or refresh if you expect new events."
      />
    );
  }
  return (
    <PageState
      variant="empty"
      title="No activity"
      description="There are no recent events in this section for the current filter."
    />
  );
}
