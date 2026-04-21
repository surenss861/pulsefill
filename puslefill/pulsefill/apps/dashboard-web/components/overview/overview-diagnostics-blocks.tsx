"use client";

import { DeliveryReliabilityCard } from "@/components/overview/delivery-reliability-card";
import { OpsBreakdownHighlights } from "@/components/overview/ops-breakdown-highlights";
import type { DeliveryReliabilityResponse } from "@/types/delivery-reliability";
import type { OpsBreakdownResponse } from "@/types/ops-breakdown";

type DeliveryProps = {
  data?: DeliveryReliabilityResponse | null;
  loading?: boolean;
};

const DELIVERY_TITLE = "Delivery reliability";
const DELIVERY_SUB =
  "See whether recovery is being limited by failed or suppressed notifications.";
const OPS_TITLE = "Recovery workflow breakdown";
const OPS_SUB = "Understand where slots are progressing, stalling, or failing to convert.";

/**
 * Diagnostic sections below the digest / queue preview — explain failure vs workflow stuck points.
 */
export function OverviewDeliveryReliabilityBlock({ data, loading }: DeliveryProps) {
  if (loading) {
    return (
      <div style={{ marginTop: 16 }}>
        <h3 style={{ margin: "0 0 8px 0", fontSize: 16, fontWeight: 650 }}>{DELIVERY_TITLE}</h3>
        <p style={{ color: "var(--muted)", fontSize: 14 }}>Loading delivery reliability…</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div style={{ marginTop: 22 }}>
      <h3 style={{ margin: "0 0 8px 0", fontSize: 16, fontWeight: 650 }}>{DELIVERY_TITLE}</h3>
      <p style={{ margin: "0 0 12px 0", fontSize: 13, color: "var(--muted)", maxWidth: 720 }}>{DELIVERY_SUB}</p>
      <DeliveryReliabilityCard data={data} headingMode="embedded" />
    </div>
  );
}

type OpsProps = {
  data?: OpsBreakdownResponse | null;
  loading?: boolean;
};

export function OverviewOpsBreakdownBlock({ data, loading }: OpsProps) {
  if (loading) {
    return (
      <div style={{ marginTop: 22 }}>
        <h3 style={{ margin: "0 0 10px 0", fontSize: 16, fontWeight: 650 }}>{OPS_TITLE}</h3>
        <p style={{ color: "var(--muted)", fontSize: 14 }}>Loading recovery breakdown…</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div style={{ marginTop: 22 }}>
      <h3 style={{ margin: "0 0 8px 0", fontSize: 16, fontWeight: 650 }}>{OPS_TITLE}</h3>
      <p style={{ margin: "0 0 12px 0", fontSize: 13, color: "var(--muted)", maxWidth: 720 }}>{OPS_SUB}</p>
      <OpsBreakdownHighlights data={data} />
    </div>
  );
}
