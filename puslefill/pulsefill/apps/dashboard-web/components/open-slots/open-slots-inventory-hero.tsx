import Link from "next/link";
import { PageCommandHeader } from "@/components/operator/page-command-header";
import { actionLinkStyle } from "@/components/ui/action-button";

export function OpenSlotsInventoryHero() {
  return (
    <PageCommandHeader
      tone="strong"
      eyebrow="Openings"
      title="Openings"
      description="Create, send, and confirm recovered appointment times."
      primaryAction={
        <Link href="/open-slots/create" style={actionLinkStyle("primary")}>
          Create opening
        </Link>
      }
      style={{ marginBottom: 12 }}
    />
  );
}
