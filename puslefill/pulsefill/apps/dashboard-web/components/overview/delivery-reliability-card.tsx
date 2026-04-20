"use client";

import type { DeliveryReliabilityResponse } from "@/types/delivery-reliability";

type Props = {
  data: DeliveryReliabilityResponse;
};

export function DeliveryReliabilityCard({ data }: Props) {
  const s = data.summary;

  return (
    <div
      style={{
        display: "grid",
        gap: 12,
        padding: 16,
        borderRadius: 18,
        border: "1px solid rgba(255,255,255,0.08)",
        background: "rgba(255,255,255,0.03)",
      }}
    >
      <div style={{ fontSize: 18, fontWeight: 700 }}>Delivery reliability</div>

      <div style={{ fontSize: 13, opacity: 0.8 }}>
        {s.delivered_today} delivered · {s.failed_today} failed · {s.simulated_today} simulated
      </div>

      <div style={{ fontSize: 13, opacity: 0.8 }}>
        {s.customers_with_no_push_device} no push device · {s.customers_with_no_reachable_channel} no reachable channel
      </div>

      {data.highlights.top_failure_reason ? (
        <div style={{ fontSize: 12, opacity: 0.72 }}>
          Top issue: {data.highlights.top_failure_reason}
        </div>
      ) : null}
    </div>
  );
}
