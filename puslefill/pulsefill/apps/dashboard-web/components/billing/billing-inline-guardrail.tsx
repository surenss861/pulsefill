"use client";

import Link from "next/link";
import type { BillingSummaryResponse } from "@/types/billing";
import { useBillingSessionActions } from "@/hooks/useBillingSessionActions";

export type BillingInlineGuardrailProps = {
  summary: Pick<BillingSummaryResponse, "entitlements" | "subscription_checkout_available" | "billing_portal_available"> | null;
  onStartCheckout?: () => void | Promise<void>;
  onOpenPortal?: () => void | Promise<void>;
  checkoutLoading?: boolean;
  portalLoading?: boolean;
};

/**
 * Compact soft warning near growth actions (invite, create opening, send offers).
 * Does not disable anything. Hidden when `billing_notice_required` is false or summary is missing.
 */
export function BillingInlineGuardrail({
  summary,
  onStartCheckout,
  onOpenPortal,
  checkoutLoading: checkoutLoadingProp,
  portalLoading: portalLoadingProp,
}: BillingInlineGuardrailProps) {
  const internal = useBillingSessionActions();
  const checkoutLoading = checkoutLoadingProp ?? internal.checkoutLoading;
  const portalLoading = portalLoadingProp ?? internal.portalLoading;
  const parentOwnsSessions = Boolean(onStartCheckout || onOpenPortal);
  const sessionError = parentOwnsSessions ? null : internal.sessionError;

  const ent = summary?.entitlements;
  if (!ent || ent.billing_notice_required !== true) return null;

  const canCheckout = Boolean(summary?.subscription_checkout_available);
  const canPortal = Boolean(summary?.billing_portal_available);

  const runCheckout = onStartCheckout ?? (() => void internal.startCheckout());
  const runPortal = onOpenPortal ?? (() => void internal.openPortal());

  let primary: { kind: "checkout" | "portal" | "link"; label: string; onClick?: () => void; href?: string } = {
    kind: "link",
    label: "View billing",
    href: "/billing",
  };
  if (canCheckout) {
    primary = { kind: "checkout", label: "Start subscription", onClick: () => void runCheckout() };
  } else if (canPortal) {
    primary = { kind: "portal", label: "Open billing portal", onClick: () => void runPortal() };
  }

  const showSecondaryPortal = canCheckout && canPortal;
  const err = sessionError;

  const btnBase = {
    borderRadius: 8,
    fontSize: 11,
    fontWeight: 600,
    padding: "6px 10px",
    cursor: checkoutLoading || portalLoading ? ("wait" as const) : ("pointer" as const),
    fontFamily: "inherit",
  } as const;

  return (
    <div
      role="note"
      style={{
        borderRadius: 10,
        border: "1px solid rgba(251,191,36,0.28)",
        background: "rgba(251,146,60,0.07)",
        padding: "10px 12px",
        display: "flex",
        flexDirection: "column",
        gap: 6,
        minWidth: 0,
      }}
    >
      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 10px", alignItems: "baseline", minWidth: 0 }}>
        <span style={{ fontSize: 12, fontWeight: 650, color: "rgba(254,215,170,0.96)" }}>{ent.notice.title}</span>
        <span className="pf-muted-copy" style={{ fontSize: 11, lineHeight: 1.45, color: "rgba(245,247,250,0.72)", flex: "1 1 200px", minWidth: 0 }}>
          {ent.notice.message}{" "}
          <span style={{ color: "rgba(245,247,250,0.55)" }}>You can continue for now.</span>
        </span>
      </div>
      {err ? (
        <p className="pf-muted-copy" style={{ margin: 0, fontSize: 11, color: "rgba(248,113,113,0.9)" }}>
          {err}
        </p>
      ) : null}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
        {primary.kind === "link" && primary.href ? (
          <Link
            href={primary.href}
            style={{
              ...btnBase,
              border: "1px solid rgba(255,255,255,0.14)",
              background: "rgba(255,255,255,0.06)",
              color: "var(--pf-text-primary)",
              textDecoration: "none",
            }}
          >
            {primary.label}
          </Link>
        ) : (
          <button
            type="button"
            disabled={checkoutLoading || portalLoading}
            onClick={primary.onClick}
            style={{
              ...btnBase,
              border: "1px solid rgba(255,255,255,0.14)",
              background: "rgba(255,255,255,0.06)",
              color: "var(--pf-text-primary)",
            }}
          >
            {primary.kind === "checkout" && checkoutLoading
              ? "Starting…"
              : primary.kind === "portal" && portalLoading
                ? "Opening…"
                : primary.label}
          </button>
        )}
        {showSecondaryPortal ? (
          <button
            type="button"
            disabled={checkoutLoading || portalLoading}
            onClick={() => void runPortal()}
            style={{
              ...btnBase,
              border: "1px solid rgba(255,255,255,0.1)",
              background: "transparent",
              color: "rgba(245,247,250,0.8)",
            }}
          >
            {portalLoading ? "Opening…" : "Open billing portal"}
          </button>
        ) : null}
      </div>
    </div>
  );
}
