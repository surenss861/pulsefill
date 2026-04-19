"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/components/ui/toast-provider";
import { pressableHandlers, pressablePrimary, pressableSecondary } from "@/lib/pressable";

type SendOffersResponse = {
  ok?: boolean;
  matched?: number;
  offer_ids?: string[];
  notification_queue?: { queued?: boolean; count?: number };
  message?: string;
};

export type LastSendOffersResult = {
  matched: number;
  offersCreated: number;
  queued: boolean | null;
  queueCount: number | null;
  message: string;
};

type Props = {
  openSlotId: string;
  onDone?: () => void;
  emphasis?: "primary" | "secondary";
  label?: string;
};

export function RetryOffersButton({ openSlotId, onDone, emphasis = "secondary", label }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<LastSendOffersResult | null>(null);
  const { showToast } = useToast();

  const defaultLabel = emphasis === "primary" ? "Send offers" : "Send / retry offers";
  const buttonLabel = label ?? defaultLabel;
  const buttonStyle = emphasis === "primary" ? pressablePrimary : pressableSecondary;

  async function handleSend() {
    try {
      setLoading(true);
      setError(null);
      setLastResult(null);
      const result = await apiFetch<SendOffersResponse>(`/v1/open-slots/${openSlotId}/send-offers`, {
        method: "POST",
        body: JSON.stringify({}),
      });

      const matched = result.matched ?? 0;
      const offersCreated = Array.isArray(result.offer_ids) ? result.offer_ids.length : 0;
      const q = result.notification_queue;
      const queued = q ? q.queued : null;
      const queueCount = q && typeof q.count === "number" ? q.count : null;

      const nextMessage = result.message ?? "Offers updated.";
      setLastResult({
        matched,
        offersCreated,
        queued,
        queueCount,
        message: nextMessage,
      });

      showToast({
        title: nextMessage,
        tone: nextMessage.includes("No matching") || nextMessage.includes("No new offers") ? "info" : "success",
      });
      onDone?.();
    } catch (err) {
      const nextError = err instanceof Error ? err.message : "Failed to send offers";
      setError(nextError);
      showToast({ title: "Couldn’t send offers.", tone: "error" });
    } finally {
      setLoading(false);
    }
  }

  const isInfoResult =
    lastResult &&
    (lastResult.message.includes("No matching") ||
      lastResult.message.includes("No new offers") ||
      lastResult.matched === 0);

  return (
    <div style={{ display: "grid", gap: 10, minWidth: 0, maxWidth: 420 }}>
      <button
        type="button"
        onClick={() => void handleSend()}
        disabled={loading}
        style={{
          ...buttonStyle,
          opacity: loading ? 0.65 : 1,
          cursor: loading ? "not-allowed" : "pointer",
          justifySelf: "start",
        }}
        {...pressableHandlers(loading)}
      >
        {loading ? "Sending offers…" : buttonLabel}
      </button>

      {lastResult ? (
        <div
          style={{
            borderRadius: 14,
            border: `1px solid ${isInfoResult ? "rgba(251,191,36,0.28)" : "rgba(52,211,153,0.25)"}`,
            background: isInfoResult ? "rgba(251,191,36,0.06)" : "rgba(16,185,129,0.07)",
            padding: "12px 14px",
            fontSize: 13,
            lineHeight: 1.5,
            color: "var(--text)",
          }}
        >
          <p style={{ margin: 0, fontWeight: 600, fontSize: 12, color: "var(--muted)" }}>Result</p>
          <p style={{ margin: "6px 0 0", color: "var(--text)" }}>{lastResult.message}</p>
          <ul style={{ margin: "10px 0 0", paddingLeft: 18, color: "var(--muted)", fontSize: 12 }}>
            <li>
              Standby matches considered: <strong style={{ color: "var(--text)" }}>{lastResult.matched}</strong>
            </li>
            <li>
              Offers created this run: <strong style={{ color: "var(--text)" }}>{lastResult.offersCreated}</strong>
            </li>
            <li>
              Notifications:{" "}
              {lastResult.queued === true ? (
                <strong style={{ color: "var(--text)" }}>
                  Queued for delivery
                  {lastResult.queueCount != null ? ` (${lastResult.queueCount} job${lastResult.queueCount === 1 ? "" : "s"})` : ""}
                </strong>
              ) : lastResult.queued === false ? (
                <strong style={{ color: "var(--text)" }}>Not queued (check Redis / worker)</strong>
              ) : (
                <span>—</span>
              )}
            </li>
          </ul>
          <p style={{ margin: "10px 0 0", fontSize: 12, color: "var(--muted)" }}>
            Tip: check <strong style={{ color: "var(--text)" }}>Offers</strong> and notification logs below for delivery
            status.
          </p>
        </div>
      ) : null}

      {error ? <p style={{ margin: 0, fontSize: 13, color: "#f87171" }}>{error}</p> : null}
    </div>
  );
}
