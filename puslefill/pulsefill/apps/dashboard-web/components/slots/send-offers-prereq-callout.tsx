"use client";

import Link from "next/link";
import type { CSSProperties } from "react";

const box: CSSProperties = {
  marginTop: 16,
  padding: 14,
  borderRadius: 14,
  border: "1px solid rgba(251,191,36,0.35)",
  background: "rgba(251,191,36,0.08)",
  fontSize: 13,
  lineHeight: 1.55,
  color: "var(--text)",
  maxWidth: 720,
};

/**
 * Explains that send-offers needs active standby preferences (customers + prefs),
 * and that the overview “offers sent” metric counts slot_offers rows.
 */
export function SendOffersPrereqCallout() {
  return (
    <div style={box}>
      <strong style={{ display: "block", marginBottom: 6 }}>How offers get matched</strong>
      PulseFill sends each opening to customers who have an <strong>active membership</strong> with this clinic and{" "}
      <strong>active standby preferences</strong> that fit the opening (service, location, time window, and notice
      rules). Invite-only and directory customers are treated the same once they are connected. If nobody matches yet,
      no offers are sent and <strong>Offers sent</strong> stays at 0.{" "}
      <Link href="/customers" style={{ color: "var(--primary)", fontWeight: 600 }}>
        Invite standby customers
      </Link>
      .
    </div>
  );
}
