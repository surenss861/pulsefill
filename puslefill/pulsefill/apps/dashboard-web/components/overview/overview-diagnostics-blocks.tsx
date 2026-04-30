"use client";

import type { CSSProperties } from "react";
import { DeliveryReliabilityCard } from "@/components/overview/delivery-reliability-card";
import { OpsBreakdownHighlights } from "@/components/overview/ops-breakdown-highlights";
import { operatorSurfaceShell } from "@/lib/operator-surface-styles";
import type { DeliveryReliabilityResponse } from "@/types/delivery-reliability";
import type { OpsBreakdownResponse } from "@/types/ops-breakdown";

const diagnosticsShell = {
  ...operatorSurfaceShell("quiet"),
  padding: "16px 18px",
  marginTop: 20,
} as const;

const diagnosticsTitle: CSSProperties = {
  margin: "0 0 6px 0",
  fontSize: 13,
  fontWeight: 600,
  letterSpacing: "0.06em",
  textTransform: "uppercase" as const,
  color: "rgba(245,247,250,0.4)",
};

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
      <div style={diagnosticsShell}>
        <h3 style={diagnosticsTitle}>{DELIVERY_TITLE}</h3>
        <p style={{ color: "rgba(245,247,250,0.38)", fontSize: 13, margin: 0 }}>Loading delivery reliability…</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div style={diagnosticsShell}>
      <h3 style={diagnosticsTitle}>{DELIVERY_TITLE}</h3>
      <p style={{ margin: "0 0 12px 0", fontSize: 12, lineHeight: 1.5, color: "rgba(245,247,250,0.42)", maxWidth: 720 }}>
        {DELIVERY_SUB}
      </p>
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
      <div style={diagnosticsShell}>
        <h3 style={diagnosticsTitle}>{OPS_TITLE}</h3>
        <p style={{ color: "rgba(245,247,250,0.38)", fontSize: 13, margin: 0 }}>Loading recovery breakdown…</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div style={diagnosticsShell}>
      <h3 style={diagnosticsTitle}>{OPS_TITLE}</h3>
      <p style={{ margin: "0 0 12px 0", fontSize: 12, lineHeight: 1.5, color: "rgba(245,247,250,0.42)", maxWidth: 720 }}>{OPS_SUB}</p>
      <OpsBreakdownHighlights data={data} />
    </div>
  );
}
