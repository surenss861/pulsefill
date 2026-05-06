"use client";

import Link from "next/link";
import type { BillingSummaryResponse } from "@/types/billing";
import { useBillingSessionActions } from "@/hooks/useBillingSessionActions";

export type BillingNoticeBannerProps = {
  /** When older APIs omit entitlements, the banner stays hidden. */
  summary: Pick<BillingSummaryResponse, "entitlements" | "subscription_checkout_available" | "billing_portal_available"> | null;
  /** If provided, used instead of internal POST for checkout (e.g. billing page coordinates loading/errors). */
  onStartCheckout?: () => void | Promise<void>;
  onOpenPortal?: () => void | Promise<void>;
  checkoutLoading?: boolean;
  portalLoading?: boolean;
};

export function BillingNoticeBanner({
  summary,
  onStartCheckout,
  onOpenPortal,
  checkoutLoading: checkoutLoadingProp,
  portalLoading: portalLoadingProp,
}: BillingNoticeBannerProps) {
  const ent = summary?.entitlements;
  const internal = useBillingSessionActions();
  const checkoutLoading = checkoutLoadingProp ?? internal.checkoutLoading;
  const portalLoading = portalLoadingProp ?? internal.portalLoading;
  const parentOwnsSessions = Boolean(onStartCheckout || onOpenPortal);
  const localError = parentOwnsSessions ? null : internal.sessionError;

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

  return (
    <div
      role="status"
      style={{
        borderRadius: 12,
        border: "1px solid rgba(251,191,36,0.35)",
        background: "rgba(251,191,36,0.08)",
        padding: "12px 14px",
        display: "flex",
        flexDirection: "column",
        gap: 8,
        minWidth: 0,
      }}
    >
      <div style={{ minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 650, color: "rgba(254,243,199,0.95)" }}>{ent.notice.title}</p>
        <p className="pf-muted-copy" style={{ margin: "6px 0 0", fontSize: 12, lineHeight: 1.5, color: "rgba(245,247,250,0.78)" }}>
          {ent.notice.message}
        </p>
      </div>
      {localError ? (
        <p className="pf-muted-copy" style={{ margin: 0, fontSize: 12, color: "rgba(248,113,113,0.92)" }}>
          {localError}
        </p>
      ) : null}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
        {primary.kind === "link" && primary.href ? (
          <Link
            href={primary.href}
            style={{
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.16)",
              background: "rgba(255,255,255,0.08)",
              color: "var(--pf-text-primary)",
              padding: "8px 12px",
              fontSize: 12,
              fontWeight: 600,
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
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.16)",
              background: "rgba(255,255,255,0.08)",
              color: "var(--pf-text-primary)",
              padding: "8px 12px",
              fontSize: 12,
              fontWeight: 600,
              cursor: checkoutLoading || portalLoading ? "wait" : "pointer",
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
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "transparent",
              color: "rgba(245,247,250,0.82)",
              padding: "8px 12px",
              fontSize: 12,
              fontWeight: 600,
              cursor: checkoutLoading || portalLoading ? "wait" : "pointer",
            }}
          >
            {portalLoading ? "Opening…" : "Open billing portal"}
          </button>
        ) : null}
      </div>
    </div>
  );
}
