"use client";

import { useMemo } from "react";
import { displayCustomer } from "@/lib/customer-ref";
import type { NotificationAttemptRow } from "@/types/notification-attempt";

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-CA", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

function short(v: string | null | undefined, n = 12) {
  if (!v) return "—";
  if (v.length <= n) return v;
  return `${v.slice(0, Math.max(4, n - 8))}…${v.slice(-6)}`;
}

function statusTone(status: string): { border: string; bg: string } {
  const s = status.toLowerCase();
  if (s === "sent") return { border: "rgba(52,211,153,0.35)", bg: "rgba(16,185,129,0.08)" };
  if (s === "suppressed") return { border: "rgba(250,204,21,0.35)", bg: "rgba(250,204,21,0.08)" };
  if (s === "failed") return { border: "rgba(248,113,113,0.35)", bg: "rgba(239,68,68,0.1)" };
  return { border: "rgba(255,255,255,0.14)", bg: "rgba(255,255,255,0.055)" };
}

function apnsFailureHint(errorCode: string | null): string | null {
  const code = (errorCode ?? "").toLowerCase();
  if (!code.startsWith("apns_")) return null;
  if (code.includes("baddevicetoken")) return "Device token is invalid for current APNs environment.";
  if (code.includes("topicdisallowed")) return "APNs topic/bundle is not allowed for this key.";
  if (code.includes("invalidprovidertoken")) return "Provider auth token is invalid (Team/Key/Private key mismatch).";
  if (code.includes("expiredprovidertoken")) return "Provider auth token expired; retry should refresh token.";
  if (code.includes("missingdevicetoken")) return "Device token was missing in request.";
  if (code.includes("devicetokennotfortopic")) return "Device token does not match APNs topic/bundle.";
  if (code.includes("toomanyrequests")) return "APNs rate limit hit; retry with backoff.";
  if (code.includes("network_error")) return "Network error while contacting APNs; retry likely succeeds.";
  return "APNs rejected this push; verify token, bundle topic, and APNs credentials.";
}

export function NotificationAttemptsPanel({ attempts }: { attempts: NotificationAttemptRow[] }) {
  const summary = useMemo(
    () =>
      attempts.reduce(
        (acc, attempt) => {
          const status = attempt.status.toLowerCase();
          if (status === "queued") acc.queued += 1;
          if (status === "suppressed") acc.suppressed += 1;
          if (status === "sent") acc.sent += 1;
          if (status === "failed") acc.failed += 1;
          return acc;
        },
        {
          queued: 0,
          suppressed: 0,
          sent: 0,
          failed: 0,
        },
      ),
    [attempts],
  );

  return (
    <div style={{ display: "grid", gap: 10 }}>
      <p style={{ margin: 0, fontSize: 12, color: "var(--muted)" }}>
        Shows push decisions for this opening, including sends, suppressions, failures, and queued attempts.
      </p>
      {attempts.length > 0 ? (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          <span
            style={{
              borderRadius: 999,
              border: "1px solid rgba(52,211,153,0.28)",
              background: "rgba(16,185,129,0.08)",
              color: "rgba(167,243,208,0.95)",
              padding: "3px 10px",
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            Sent {summary.sent}
          </span>
          <span
            style={{
              borderRadius: 999,
              border: "1px solid rgba(255,255,255,0.14)",
              background: "rgba(255,255,255,0.055)",
              color: "rgba(245,247,250,0.74)",
              padding: "3px 10px",
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            Suppressed {summary.suppressed}
          </span>
          <span
            style={{
              borderRadius: 999,
              border: "1px solid rgba(248,113,113,0.35)",
              background: "rgba(239,68,68,0.12)",
              color: "rgba(254,202,202,0.95)",
              padding: "3px 10px",
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            Failed {summary.failed}
          </span>
          <span
            style={{
              borderRadius: 999,
              border: "1px solid rgba(251,146,60,0.35)",
              background: "rgba(251,146,60,0.1)",
              color: "rgba(254,215,170,0.95)",
              padding: "3px 10px",
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            Queued {summary.queued}
          </span>
        </div>
      ) : null}
      {attempts.map((a) => {
        const tone = statusTone(a.status);
        const reason = a.suppression_reason || a.error_code || a.error_message || "—";
        const hint = apnsFailureHint(a.error_code);
        return (
          <div
            key={a.id}
            style={{
              borderRadius: 14,
              border: `1px solid ${tone.border}`,
              background: tone.bg,
              padding: "12px 14px",
              display: "grid",
              gap: 6,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <span style={{ fontSize: 12, fontWeight: 650, color: "var(--pf-text-primary)" }}>{a.type}</span>
              <span style={{ fontSize: 11, color: "var(--muted)" }}>{formatDate(a.created_at)}</span>
            </div>
            <div style={{ display: "grid", gap: 4, gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", fontSize: 12 }}>
              <span>
                <span style={{ color: "var(--muted)" }}>Status · </span>
                <strong>{a.status}</strong>
              </span>
              <span>
                <span style={{ color: "var(--muted)" }}>Customer · </span>
                {displayCustomer(a.customer_id)}
              </span>
              <span>
                <span style={{ color: "var(--muted)" }}>Dedupe · </span>
                {short(a.dedupe_key)}
              </span>
              <span>
                <span style={{ color: "var(--muted)" }}>Reason · </span>
                {short(reason, 22)}
              </span>
            </div>
            {hint ? (
              <p style={{ margin: "2px 0 0", fontSize: 11, color: "rgba(254,215,170,0.95)" }}>
                Hint: {hint}
              </p>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
