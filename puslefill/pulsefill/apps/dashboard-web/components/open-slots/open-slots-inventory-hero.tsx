import Link from "next/link";
import type { CSSProperties } from "react";
import { PageIntroCard } from "@/components/ui/page-intro-card";

const primaryLinkStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: 40,
  padding: "0 16px",
  borderRadius: 12,
  border: "1px solid rgba(255, 122, 24, 0.45)",
  background: "linear-gradient(180deg, #ff7a18 0%, #f97316 100%)",
  color: "var(--pf-btn-primary-text)",
  fontSize: 14,
  fontWeight: 700,
  textDecoration: "none",
  boxShadow: "0 14px 34px rgba(255, 122, 24, 0.22)",
};

export function OpenSlotsInventoryHero() {
  return (
    <PageIntroCard
      style={{ marginBottom: 24 }}
      overline="Openings"
      title="Appointment openings"
      description="Cancelled appointment times your team can recover. Send offers to matching standby customers, track claims, and confirm recovered bookings."
      actions={
        <Link href="/open-slots/create" style={primaryLinkStyle}>
          Create opening
        </Link>
      }
    />
  );
}
