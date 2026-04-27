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
      <strong style={{ display: "block", marginBottom: 6 }}>Before “Send offers” can create offers</strong>
      PulseFill matches each open slot to <strong>active standby preferences</strong> for this business. If no customer
      has a matching preference, the API returns <em>no matches</em>, creates no <code>slot_offers</code> rows, and
      the setup metric <strong>Offers sent</strong> stays at 0. In production, customers and preferences usually come
      from the consumer app; for dev, use your seed script or Supabase.{" "}
      <Link href="/customers" style={{ color: "var(--primary)", fontWeight: 600 }}>
        More on the Customers page
      </Link>
      .
    </div>
  );
}
