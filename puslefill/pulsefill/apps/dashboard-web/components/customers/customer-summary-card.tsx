"use client";

import type { OperatorCustomerContextResponse } from "@/types/operator-customer-context";

type Props = {
  customer: OperatorCustomerContextResponse["customer"];
  delivery: OperatorCustomerContextResponse["delivery_context"];
};

function formatWhen(iso: string | null) {
  if (!iso) return null;
  try {
    return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function CustomerSummaryCard({ customer, delivery }: Props) {
  const title = customer.display_name?.trim() || customer.email_masked || customer.phone_masked || "Customer";

  return (
    <div
      style={{
        borderRadius: 18,
        border: "1px solid rgba(255,255,255,0.1)",
        background: "rgba(255,255,255,0.04)",
        padding: 18,
        display: "grid",
        gap: 12,
      }}
    >
      <div>
        <p style={{ margin: 0, fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", color: "var(--muted)" }}>
          CUSTOMER
        </p>
        <p style={{ margin: "8px 0 0", fontSize: 20, fontWeight: 700 }}>{title}</p>
      </div>

      <div style={{ display: "grid", gap: 6, fontSize: 14 }}>
        {customer.email_masked ? (
          <p style={{ margin: 0, color: "var(--muted)" }}>
            <span style={{ opacity: 0.85 }}>Email · </span>
            <span style={{ color: "var(--text)" }}>{customer.email_masked}</span>
          </p>
        ) : null}
        {customer.phone_masked ? (
          <p style={{ margin: 0, color: "var(--muted)" }}>
            <span style={{ opacity: 0.85 }}>Phone · </span>
            <span style={{ color: "var(--text)" }}>{customer.phone_masked}</span>
          </p>
        ) : null}
        <p style={{ margin: 0, color: "var(--muted)", fontSize: 13 }}>
          Channels · Push {customer.push_enabled ? "on" : "off"} · Email {customer.email_enabled ? "on" : "off"} · SMS{" "}
          {customer.sms_enabled ? "on" : "off"}
        </p>
      </div>

      <div
        style={{
          marginTop: 4,
          paddingTop: 12,
          borderTop: "1px solid rgba(255,255,255,0.08)",
          fontSize: 13,
          color: "var(--muted)",
        }}
      >
        <p style={{ margin: 0, fontSize: 11, fontWeight: 700, letterSpacing: "0.06em" }}>DELIVERY READINESS</p>
        <p style={{ margin: "8px 0 0" }}>
          Push:{" "}
          <strong style={{ color: "var(--text)" }}>{delivery.has_push_ready ? "Ready" : "Not ready"}</strong> · Email:{" "}
          <strong style={{ color: "var(--text)" }}>{delivery.has_email ? "Available" : "Unavailable"}</strong> · SMS:{" "}
          <strong style={{ color: "var(--text)" }}>{delivery.has_sms ? "Available" : "Unavailable"}</strong>
        </p>
        <p style={{ margin: "6px 0 0" }}>
          Reachable:{" "}
          <strong style={{ color: "var(--text)" }}>{delivery.has_any_reachable_channel ? "Yes" : "No"}</strong>
        </p>
        <p style={{ margin: "10px 0 0" }}>
          Push devices registered: <strong style={{ color: "var(--text)" }}>{delivery.push_devices_count}</strong>
        </p>
        {delivery.last_failed_delivery_at ? (
          <p style={{ margin: "8px 0 0" }}>
            Last failed delivery:{" "}
            <span style={{ color: "#fbbf24" }}>{formatWhen(delivery.last_failed_delivery_at)}</span>
            {delivery.last_failed_delivery_reason ? (
              <span style={{ display: "block", marginTop: 4, fontSize: 12 }}>
                {delivery.last_failed_delivery_reason}
              </span>
            ) : null}
          </p>
        ) : (
          <p style={{ margin: "8px 0 0", opacity: 0.85 }}>No failed deliveries logged for this business yet.</p>
        )}
      </div>
    </div>
  );
}
