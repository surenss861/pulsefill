"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { DeskHeroCard } from "@/components/dashboard/desk/desk-hero-card";
import { DeskPageHeader } from "@/components/dashboard/desk/desk-page-header";
import { DeskSecondaryCard } from "@/components/dashboard/desk/desk-secondary-card";
import { MotionAction } from "@/components/operator/operator-motion-primitives";
import { OperatorPageTransition } from "@/components/operator/operator-page-transition";
import { OperatorLoadingState } from "@/components/operator/operator-loading-state";
import { OperatorErrorState } from "@/components/operator/operator-error-state";
import { OperatorStatusChip } from "@/components/operator/operator-status-chip";
import type { OperatorStatusKind } from "@/components/operator/operator-status-chip";
import { OperatorDeskConfirmDialog } from "@/components/operator/operator-desk-confirm-dialog";
import { BILLING_SESSION_ACTION_ERR } from "@/hooks/useBillingSessionActions";
import { apiFetch } from "@/lib/api";
import type {
  BillingSubscriptionStatus,
  BillingSummaryResponse,
  BillingSummarySubscription,
} from "@/types/billing";

const BILLING_SUMMARY = "/v1/billing/summary";
const BILLING_CHECKOUT = "/v1/billing/checkout";
const BILLING_PORTAL = "/v1/billing/portal";

function planLabel(plan: BillingSummarySubscription["plan"]): string {
  if (plan === "starter") return "Starter";
  if (plan === "growth") return "Growth";
  if (plan === "multi_location") return "Multi-location";
  return plan;
}

function subscriptionStatusLabel(status: BillingSubscriptionStatus): string {
  const labels: Record<BillingSubscriptionStatus, string> = {
    trialing: "Trial",
    active: "Active",
    past_due: "Past due",
    canceled: "Canceled",
    incomplete: "Incomplete",
  };
  return labels[status] ?? status;
}

function subscriptionStatusChipKind(status: BillingSubscriptionStatus): OperatorStatusKind {
  if (status === "active") return "confirmed";
  if (status === "trialing") return "pending";
  if (status === "past_due") return "attention";
  if (status === "canceled") return "cancelled";
  if (status === "incomplete") return "setup";
  return "inactive";
}

function formatPeriodEnd(iso: string | null): string | null {
  if (!iso?.trim()) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, { dateStyle: "medium" });
}

function billingPeriodCaption(sub: BillingSummarySubscription): string | null {
  const end = formatPeriodEnd(sub.current_period_end);
  if (sub.status === "incomplete") {
    return "Finish payment setup to turn on billing for this workspace.";
  }
  if (!end) return null;
  if (sub.status === "trialing") {
    return `Trial period ends ${end}.`;
  }
  if (sub.status === "active") {
    return `Current period ends ${end}.`;
  }
  if (sub.status === "past_due") {
    return `Payment is past due. Current period ends ${end}. Update billing to keep recovery running.`;
  }
  if (sub.status === "canceled") {
    const t = sub.current_period_end ? new Date(sub.current_period_end).getTime() : NaN;
    if (!Number.isNaN(t) && t < Date.now()) {
      return `Subscription ended (${end}).`;
    }
    return `Canceled. Access may continue until ${end}.`;
  }
  return null;
}

function BillingDetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(0, 140px) minmax(0, 1fr)",
        gap: "10px 16px",
        alignItems: "start",
        padding: "10px 0",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <span className="pf-muted-copy" style={{ fontSize: 12, lineHeight: 1.45 }}>
        {label}
      </span>
      <div style={{ fontSize: 13, lineHeight: 1.45, color: "rgba(245,247,250,0.88)", minWidth: 0 }}>{children}</div>
    </div>
  );
}

function subscriptionIsLive(sub: BillingSummarySubscription): boolean {
  return sub.status === "active" || sub.status === "trialing";
}

function checkoutShouldBeHeroPrimary(sub: BillingSummarySubscription | null): boolean {
  if (!sub) return true;
  if (sub.status === "incomplete") return true;
  if (sub.status === "canceled") return true;
  return false;
}

function defaultHeroTitle(data: BillingSummaryResponse): string {
  if (!data.stripe_billing_available) {
    return "Billing isn’t connected here";
  }
  const sub = data.subscription;
  if (!sub) {
    return "Billing is not active yet";
  }
  if (subscriptionIsLive(sub)) {
    return "Billing is active";
  }
  if (sub.status === "past_due") {
    return "Payment needs attention";
  }
  if (sub.status === "incomplete") {
    return "Finish payment setup";
  }
  if (sub.status === "canceled") {
    return "Subscription ended";
  }
  return "Billing status";
}

function defaultHeroMeta(data: BillingSummaryResponse): string {
  if (!data.stripe_billing_available) {
    return "Stripe billing is not configured for this environment. Checkout and the customer portal turn on when your operator adds Stripe keys.";
  }
  const sub = data.subscription;
  if (!sub) {
    return "Turn on billing when you’re ready to use PulseFill with customers.";
  }
  if (subscriptionIsLive(sub)) {
    return `Your workspace is on the ${planLabel(sub.plan)} plan. Payment details stay in Stripe — PulseFill stores plan and status only.`;
  }
  if (sub.status === "past_due") {
    return "Update your payment method or subscription in the billing portal so offers and invites keep working.";
  }
  if (sub.status === "incomplete") {
    return "Your subscription setup was started but isn’t finished yet.";
  }
  if (sub.status === "canceled") {
    return "You can start a new subscription when checkout is available, or manage past invoices in the billing portal.";
  }
  return "Review plan and billing below.";
}

export default function BillingPage() {
  const [data, setData] = useState<BillingSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [checkoutConfirmOpen, setCheckoutConfirmOpen] = useState(false);
  const [portalConfirmOpen, setPortalConfirmOpen] = useState(false);
  const lastSessionKindRef = useRef<"checkout" | "portal">("checkout");

  const load = useCallback(async () => {
    try {
      setError(null);
      setActionError(null);
      setLoading(true);
      const res = await apiFetch<BillingSummaryResponse>(BILLING_SUMMARY);
      setData(res);
    } catch (e) {
      setData(null);
      setError(e instanceof Error ? e.message : "Couldn’t load billing.");
    } finally {
      setLoading(false);
    }
  }, []);

  const startCheckout = useCallback(async () => {
    try {
      setActionError(null);
      setCheckoutLoading(true);
      const res = await apiFetch<{ url: string }>(BILLING_CHECKOUT, { method: "POST", body: "{}" });
      if (res.url) window.location.assign(res.url);
      else setActionError(BILLING_SESSION_ACTION_ERR);
    } catch {
      setActionError(BILLING_SESSION_ACTION_ERR);
    } finally {
      setCheckoutLoading(false);
    }
  }, []);

  const openPortal = useCallback(async () => {
    try {
      setActionError(null);
      setPortalLoading(true);
      const res = await apiFetch<{ url: string }>(BILLING_PORTAL, { method: "POST", body: "{}" });
      if (res.url) window.location.assign(res.url);
      else setActionError(BILLING_SESSION_ACTION_ERR);
    } catch {
      setActionError(BILLING_SESSION_ACTION_ERR);
    } finally {
      setPortalLoading(false);
    }
  }, []);

  const runConfirmedCheckout = useCallback(async () => {
    lastSessionKindRef.current = "checkout";
    try {
      await startCheckout();
    } finally {
      setCheckoutConfirmOpen(false);
    }
  }, [startCheckout]);

  const runConfirmedPortal = useCallback(async () => {
    lastSessionKindRef.current = "portal";
    try {
      await openPortal();
    } finally {
      setPortalConfirmOpen(false);
    }
  }, [openPortal]);

  useEffect(() => {
    void load();
  }, [load]);

  const sub = data?.subscription ?? null;
  const periodCaption = sub ? billingPeriodCaption(sub) : null;
  const ent = data?.entitlements;
  const noticeRequired = Boolean(ent?.billing_notice_required && ent?.notice);

  const heroTitle =
    noticeRequired && ent?.notice?.title?.trim() ? ent.notice.title.trim() : data ? defaultHeroTitle(data) : "Billing";

  const heroMeta =
    noticeRequired && ent?.notice?.message?.trim()
      ? ent.notice.message.trim()
      : data
        ? defaultHeroMeta(data)
        : "";

  const showActivatePrimary =
    data &&
    data.stripe_billing_available &&
    data.subscription_checkout_available &&
    checkoutShouldBeHeroPrimary(sub);

  const showManagePrimary =
    data &&
    data.stripe_billing_available &&
    data.billing_portal_available &&
    !showActivatePrimary;

  const heroEyebrow =
    data && data.stripe_billing_available && sub && subscriptionIsLive(sub) ? "Workspace" : undefined;

  const heroExtraLine =
    showActivatePrimary && data && !sub
      ? "Activate billing so your workspace is ready for customer recovery."
      : null;

  const workspaceNote = (() => {
    if (!data) return null;
    if (!data.stripe_billing_available) {
      return "Billing can be activated after Stripe is configured for this API environment.";
    }
    if (!data.billing_portal_available && !data.subscription_checkout_available) {
      return "Billing can be activated after setup is complete and your operator enables checkout and the customer portal.";
    }
    return null;
  })();

  return (
    <main className="pf-page-billing pf-desk-page" style={{ padding: 0 }}>
      <OperatorPageTransition>
        <div className="pf-overview-desk-stack">
          <DeskPageHeader
            title="Billing file"
            subtitle="Turn on billing when you’re ready to use PulseFill with customers."
            actions={
              <Link href="/settings" className="pf-desk-quiet-link" style={{ marginTop: 0 }}>
                Workspace
              </Link>
            }
          />

          {loading ? (
            <OperatorLoadingState variant="section" skeleton="rows" title="Loading billing file…" />
          ) : null}

          {!loading && error ? (
            <div>
              <OperatorErrorState rawMessage={error} />
              <button type="button" className="pf-desk-quiet-link" style={{ marginTop: 10, fontSize: 13 }} onClick={() => void load()}>
                Try again
              </button>
            </div>
          ) : null}

          {!loading && !error && data ? (
            <>
              <DeskHeroCard title={heroTitle} titleId="pf-billing-hero-title" eyebrow={heroEyebrow}>
                <p className="pf-desk-hero-card__meta">{heroMeta}</p>
                {heroExtraLine ? (
                  <p className="pf-muted-copy" style={{ margin: 0, fontSize: 13, lineHeight: 1.55 }}>
                    {heroExtraLine}
                  </p>
                ) : null}
                {actionError ? (
                  <div className="pf-desk-invite-error" role="alert" style={{ marginTop: 10 }}>
                    <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5 }}>{actionError}</p>
                    <button
                      type="button"
                      className="pf-desk-quiet-link"
                      style={{ marginTop: 10, fontSize: 13 }}
                      onClick={() => {
                        setActionError(null);
                        if (lastSessionKindRef.current === "portal") setPortalConfirmOpen(true);
                        else setCheckoutConfirmOpen(true);
                      }}
                    >
                      Try again
                    </button>
                  </div>
                ) : null}
                {showActivatePrimary ? (
                  <MotionAction style={{ marginTop: 14 }}>
                    <button
                      type="button"
                      className="pf-desk-save-access"
                      disabled={checkoutLoading}
                      onClick={() => setCheckoutConfirmOpen(true)}
                    >
                      {checkoutLoading ? "Starting…" : "Activate billing"}
                    </button>
                  </MotionAction>
                ) : showManagePrimary ? (
                  <MotionAction style={{ marginTop: 14 }}>
                    <button
                      type="button"
                      className="pf-desk-save-access"
                      disabled={portalLoading}
                      onClick={() => setPortalConfirmOpen(true)}
                    >
                      {portalLoading ? "Opening…" : "Manage billing"}
                    </button>
                  </MotionAction>
                ) : data.stripe_billing_available ? (
                  <p className="pf-muted-copy" style={{ margin: "14px 0 0", fontSize: 13 }}>
                    Billing actions aren’t available for this workspace yet. Check back after setup is finished.
                  </p>
                ) : null}
              </DeskHeroCard>

              <div className="pf-desk-secondary-grid">
                {sub ? (
                  <DeskSecondaryCard title="Plan">
                    <p className="pf-muted-copy" style={{ margin: "0 0 8px", fontSize: 13, lineHeight: 1.55 }}>
                      Current plan and renewal details for this workspace.
                    </p>
                    <BillingDetailRow label="Plan">{planLabel(sub.plan)}</BillingDetailRow>
                    <BillingDetailRow label="Status">
                      <OperatorStatusChip kind={subscriptionStatusChipKind(sub.status)} label={subscriptionStatusLabel(sub.status)} />
                    </BillingDetailRow>
                    <BillingDetailRow label="Customer in Stripe">
                      {sub.stripe_customer_linked ? (
                        <span style={{ color: "rgba(74,222,128,0.9)" }}>Linked</span>
                      ) : (
                        <span style={{ color: "rgba(245,247,250,0.55)" }}>Not linked yet</span>
                      )}
                    </BillingDetailRow>
                    <BillingDetailRow label="Subscription in Stripe">
                      {sub.stripe_subscription_linked ? (
                        <span style={{ color: "rgba(74,222,128,0.9)" }}>Synced</span>
                      ) : (
                        <span style={{ color: "rgba(245,247,250,0.55)" }}>Not synced yet</span>
                      )}
                    </BillingDetailRow>
                    {periodCaption ? (
                      <BillingDetailRow label="Renewal">
                        <span style={{ color: "rgba(245,247,250,0.78)" }}>{periodCaption}</span>
                      </BillingDetailRow>
                    ) : null}
                    <div style={{ borderBottom: "none", paddingTop: 4 }} />
                  </DeskSecondaryCard>
                ) : null}

                <DeskSecondaryCard title="Billing portal">
                  <p className="pf-muted-copy" style={{ margin: "0 0 12px", fontSize: 13, lineHeight: 1.55 }}>
                    Manage payment method, invoices, and subscription in Stripe.
                  </p>
                  <button
                    type="button"
                    disabled={!data.billing_portal_available || portalLoading}
                    title={!data.billing_portal_available ? "Billing portal is not available yet" : undefined}
                    onClick={() => setPortalConfirmOpen(true)}
                    style={{
                      borderRadius: 10,
                      border: "1px solid rgba(255,255,255,0.12)",
                      background:
                        data.billing_portal_available && !portalLoading ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.04)",
                      color:
                        data.billing_portal_available && !portalLoading ? "var(--pf-text-primary)" : "rgba(245,247,250,0.45)",
                      padding: "9px 14px",
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: data.billing_portal_available && !portalLoading ? "pointer" : "not-allowed",
                    }}
                  >
                    {portalLoading ? "Opening…" : "Open billing portal"}
                  </button>
                  {showActivatePrimary && data.billing_portal_available ? (
                    <p className="pf-muted-copy" style={{ margin: "12px 0 0", fontSize: 12, lineHeight: 1.45 }}>
                      If you already pay through Stripe, you can open the portal to update cards or download invoices while you
                      activate a new subscription from the card above.
                    </p>
                  ) : null}
                </DeskSecondaryCard>
              </div>

              {workspaceNote ? (
                <DeskSecondaryCard title="Workspace note">
                  <p className="pf-muted-copy" style={{ margin: 0, fontSize: 13, lineHeight: 1.55 }}>
                    {workspaceNote}
                  </p>
                </DeskSecondaryCard>
              ) : null}
            </>
          ) : null}
        </div>
      </OperatorPageTransition>
      <OperatorDeskConfirmDialog
        open={checkoutConfirmOpen}
        titleId="pf-billing-page-confirm-checkout-title"
        title="Activate billing?"
        busy={checkoutLoading}
        primaryLabel="Activate billing"
        primaryBusyLabel="Opening Stripe…"
        primaryVariant="warm"
        onClose={() => !checkoutLoading && setCheckoutConfirmOpen(false)}
        onPrimary={() => void runConfirmedCheckout()}
      >
        <p className="pf-muted-copy" style={{ margin: 0, fontSize: 14, lineHeight: 1.55 }}>
          This opens Stripe so you can turn on billing for this workspace.
        </p>
      </OperatorDeskConfirmDialog>
      <OperatorDeskConfirmDialog
        open={portalConfirmOpen}
        titleId="pf-billing-page-confirm-portal-title"
        title="Open billing portal?"
        busy={portalLoading}
        primaryLabel="Open billing portal"
        primaryBusyLabel="Opening…"
        primaryVariant="warm"
        onClose={() => !portalLoading && setPortalConfirmOpen(false)}
        onPrimary={() => void runConfirmedPortal()}
      >
        <p className="pf-muted-copy" style={{ margin: 0, fontSize: 14, lineHeight: 1.55 }}>
          You&apos;ll manage payment methods, invoices, and your subscription in Stripe.
        </p>
      </OperatorDeskConfirmDialog>
    </main>
  );
}
