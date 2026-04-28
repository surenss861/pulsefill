import Link from "next/link";
import { PageIntroCard } from "@/components/ui/page-intro-card";
import { actionLinkStyle } from "@/components/ui/action-button";

export function OpenSlotsInventoryHero() {
  return (
    <PageIntroCard
      style={{ marginBottom: 24 }}
      overline="Openings"
      title="Appointment openings"
      description="Every cancelled appointment window, its recovery state, and where the system needs operator judgment. Filters and bulk actions continue below."
      actions={
        <Link href="/open-slots/create" style={actionLinkStyle("primary")}>
          Create opening
        </Link>
      }
    />
  );
}
