import Link from "next/link";
import { PageCommandHeader } from "@/components/operator/page-command-header";
import { actionLinkStyle } from "@/lib/operator-action-link-styles";

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
