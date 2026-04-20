"use client";

import { CustomerSummaryCard } from "@/components/customers/customer-summary-card";
import { StandbyPreferenceSnapshot } from "@/components/customers/standby-preference-snapshot";
import type { OperatorCustomerContextResponse } from "@/types/operator-customer-context";

type Props = {
  loading: boolean;
  error: string | null;
  data: OperatorCustomerContextResponse | null;
};

export function OperatorCustomerContextSection({ loading, error, data }: Props) {
  if (loading) {
    return (
      <p style={{ color: "var(--muted)", fontSize: 14 }}>Loading customer context…</p>
    );
  }

  if (error) {
    return (
      <p style={{ color: "#f87171", fontSize: 14 }}>{error}</p>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div>
        <h2 style={{ margin: "0 0 8px 0", fontSize: 16, fontWeight: 650 }}>Customer context</h2>
        <p style={{ margin: 0, fontSize: 13, color: "var(--muted)", maxWidth: 640 }}>
          Who claimed this opening, how they opted into standby, and delivery readiness for your business.
        </p>
      </div>
      <CustomerSummaryCard customer={data.customer} delivery={data.delivery_context} />
      <div>
        <h3 style={{ margin: "0 0 10px 0", fontSize: 14, fontWeight: 650, color: "var(--muted)" }}>
          Standby preferences (this business)
        </h3>
        <StandbyPreferenceSnapshot preferences={data.standby_preferences} />
      </div>
    </div>
  );
}
