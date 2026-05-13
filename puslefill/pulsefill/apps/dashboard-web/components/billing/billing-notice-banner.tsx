"use client";

import Link from "next/link";
import type { BillingSummaryResponse } from "@/types/billing";
import { useBillingSessionActions } from "@/hooks/useBillingSessionActions";

export type BillingNoticeBannerProps = {
  /** When older APIs omit entitlements, the banner stays hidden. */
  summary: Pick<BillingSummaryResponse, "entitlements" | "subscription_checkout_available" | "billing_portal_available"> | null;
  /** Overview: slimmer surface and calmer copy so billing does not compete with setup. */
  tone?: "default" | "administrative";
  /** If provided, used instead of internal POST for checkout (e.g. billing page coordinates loading/errors). */
  onStartCheckout?: () => void | Promise<void>;
  onOpenPortal?: () => void | Promise<void>;
  checkoutLoading?: boolean;
  portalLoading?: boolean;
};

export function BillingNoticeBanner({
  summary,
  tone = "default",
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
    primary = { kind: "checkout", label: "Activate billing", onClick: () => void runCheckout() };
  } else if (canPortal) {
    primary = { kind: "portal", label: "Open billing portal", onClick: () => void runPortal() };
  }

  const showSecondaryPortal = canCheckout && canPortal;

  const administrative = tone === "administrative";
  const checkoutCopy =
    administrative && canCheckout
      ? {
          title: "Billing is not active yet",
          message: "Turn on billing when you're ready to use PulseFill with customers.",
        }
      : null;

  const displayTitle = checkoutCopy?.title ?? ent.notice.title;
  const displayMessage = checkoutCopy?.message ?? ent.notice.message;

  const primaryBtnClass = administrative ? "pf-billing-notice-banner__btn pf-billing-notice-banner__btn--admin" : "pf-billing-notice-banner__btn";
  const secondaryBtnClass = administrative
    ? "pf-billing-notice-banner__btn pf-billing-notice-banner__btn--admin pf-billing-notice-banner__btn--ghost"
    : "pf-billing-notice-banner__btn pf-billing-notice-banner__btn--ghost";

  return (
    <div
      role="status"
      className={administrative ? "pf-billing-notice-banner pf-billing-notice-banner--administrative" : "pf-billing-notice-banner"}
      style={
        administrative
          ? undefined
          : {
              borderRadius: 12,
              border: "1px solid rgba(251,191,36,0.35)",
              background: "rgba(251,191,36,0.08)",
              padding: "12px 14px",
              display: "flex",
              flexDirection: "column",
              gap: 8,
              minWidth: 0,
            }
      }
    >
      <div className="pf-billing-notice-banner__main" style={administrative ? undefined : { minWidth: 0 }}>
        <p
          className="pf-billing-notice-banner__title"
          style={
            administrative
              ? undefined
              : { margin: 0, fontSize: 13, fontWeight: 650, color: "rgba(254,243,199,0.95)" }
          }
        >
          {displayTitle}
        </p>
        <p
          className="pf-billing-notice-banner__message pf-muted-copy"
          style={
            administrative
              ? undefined
              : { margin: "6px 0 0", fontSize: 12, lineHeight: 1.5, color: "rgba(245,247,250,0.78)" }
          }
        >
          {displayMessage}
        </p>
      </div>
      {localError ? (
        <p className="pf-muted-copy" style={{ margin: 0, fontSize: 12, color: "rgba(248,113,113,0.92)" }}>
          {localError}
        </p>
      ) : null}
      <div className="pf-billing-notice-banner__actions">
        {primary.kind === "link" && primary.href ? (
          <Link href={primary.href} className={primaryBtnClass}>
            {primary.label}
          </Link>
        ) : (
          <button
            type="button"
            disabled={checkoutLoading || portalLoading}
            onClick={primary.onClick}
            className={primaryBtnClass}
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
            className={secondaryBtnClass}
          >
            {portalLoading ? "Opening…" : "Open billing portal"}
          </button>
        ) : null}
      </div>
    </div>
  );
}
