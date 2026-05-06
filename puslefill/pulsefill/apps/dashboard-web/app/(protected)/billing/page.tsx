"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { MotionAction } from "@/components/operator/operator-motion-primitives";
import { OperatorPageTransition } from "@/components/operator/operator-page-transition";
import { PageCommandHeader } from "@/components/operator/page-command-header";
import { OperatorLoadingState } from "@/components/operator/operator-loading-state";
import { OperatorErrorState } from "@/components/operator/operator-error-state";
import { OperatorStatusChip } from "@/components/operator/operator-status-chip";
import type { OperatorStatusKind } from "@/components/operator/operator-status-chip";
import { actionLinkStyle } from "@/lib/operator-action-link-styles";
import { apiFetch } from "@/lib/api";
import { operatorSurfaceShell } from "@/lib/operator-surface-styles";
import { BillingNoticeBanner } from "@/components/billing/billing-notice-banner";
import type {
  BillingSubscriptionStatus,
  BillingSummaryResponse,
  BillingSummarySubscription,
} from "@/types/billing";

const BILLING_SUMMARY = "/v1/billing/summary";
const BILLING_CHECKOUT = "/v1/billing/checkout";
const BILLING_PORTAL = "/v1/billing/portal";

const BILLING_ACTION_ERROR = "We couldn't open billing right now. Try again shortly.";

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
    return "Complete payment setup when checkout is enabled for this workspace.";
  }
  if (!end) return null;
  if (sub.status === "trialing") {
    return `Trial period ends ${end} (or converts on renewal, depending on your Stripe configuration).`;
  }
  if (sub.status === "active") {
    return `Current period ends ${end}.`;
  }
  if (sub.status === "past_due") {
    return `Payment is past due. Period end ${end} — update billing in Stripe.`;
  }
  if (sub.status === "canceled") {
    const t = sub.current_period_end ? new Date(sub.current_period_end).getTime() : NaN;
    if (!Number.isNaN(t) && t < Date.now()) {
      return `Subscription ended (${end}).`;
    }
    return `Canceled; access may run until ${end}.`;
  }
  return null;
}

function BillingDetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(0, 120px) minmax(0, 1fr)",
        gap: "10px 16px",
        alignItems: "start",
        padding: "10px 0",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <span className="pf-kicker" style={{ fontSize: 10, letterSpacing: "0.12em", color: "rgba(245,247,250,0.42)" }}>
        {label}
      </span>
      <div style={{ fontSize: 13, lineHeight: 1.45, color: "rgba(245,247,250,0.88)", minWidth: 0 }}>{children}</div>
    </div>
  );
}

export default function BillingPage() {
  const [data, setData] = useState<BillingSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

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
      else setActionError(BILLING_ACTION_ERROR);
    } catch {
      setActionError(BILLING_ACTION_ERROR);
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
      else setActionError(BILLING_ACTION_ERROR);
    } catch {
      setActionError(BILLING_ACTION_ERROR);
    } finally {
      setPortalLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const sub = data?.subscription ?? null;
  const periodCaption = sub ? billingPeriodCaption(sub) : null;

  return (
    <main className="pf-page-billing" style={{ padding: 0 }}>
      <PageCommandHeader
        animate={false}
        tone="default"
        eyebrow="Workspace"
        title="Billing"
        description="Plan, subscription status, and Stripe connection for this workspace. Sensitive payment details stay in Stripe."
        secondaryAction={
          <MotionAction>
            <Link href="/settings" style={{ ...actionLinkStyle("ghost"), fontSize: 13 }}>
              Settings
            </Link>
          </MotionAction>
        }
        style={{ marginBottom: 16 }}
      />
      <OperatorPageTransition>
        <div style={{ display: "flex", flexDirection: "column", gap: 14, minWidth: 0 }}>
          {!loading && !error && data ? (
            <BillingNoticeBanner
              summary={data}
              onStartCheckout={() => void startCheckout()}
              onOpenPortal={() => void openPortal()}
              checkoutLoading={checkoutLoading}
              portalLoading={portalLoading}
            />
          ) : null}
          {loading ? <OperatorLoadingState variant="section" skeleton="rows" title="Loading billing…" /> : null}

          {!loading && error ? (
            <div>
              <OperatorErrorState rawMessage={error} />
              <button
                type="button"
                onClick={() => void load()}
                style={{
                  marginTop: 10,
                  borderRadius: 8,
                  border: "1px solid rgba(255,255,255,0.14)",
                  background: "rgba(255,255,255,0.06)",
                  color: "var(--text)",
                  padding: "8px 14px",
                  fontSize: 12,
                  cursor: "pointer",
                }}
              >
                Retry
              </button>
            </div>
          ) : null}

          {!loading && !error && data ? (
            <div
              style={{
                padding: "16px 18px 18px",
                ...operatorSurfaceShell("quiet"),
                maxWidth: 640,
              }}
            >
              {!data.stripe_billing_available ? (
                <p className="pf-muted-copy" style={{ margin: "0 0 12px", fontSize: 12, lineHeight: 1.5 }}>
                  Stripe billing is not configured for this API environment. Subscription checkout and the customer portal
                  will activate once your operator enables Stripe keys.
                </p>
              ) : (
                <p className="pf-muted-copy" style={{ margin: "0 0 12px", fontSize: 12, lineHeight: 1.5 }}>
                  Payment processing uses Stripe. PulseFill stores plan and status only — card and invoice details live in
                  Stripe.
                </p>
              )}

              {!sub ? (
                <div style={{ paddingTop: 4 }}>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 650, color: "var(--pf-text-primary)" }}>
                    No subscription on file
                  </p>
                  <p className="pf-muted-copy" style={{ margin: "8px 0 0", fontSize: 12, lineHeight: 1.5 }}>
                    When your workspace has an active Stripe subscription, plan and renewal dates will appear here. Use
                    Start subscription when your operator has enabled Stripe checkout for this environment.
                  </p>
                </div>
              ) : (
                <div style={{ marginTop: 2 }}>
                  <BillingDetailRow label="Plan">{planLabel(sub.plan)}</BillingDetailRow>
                  <BillingDetailRow label="Status">
                    <OperatorStatusChip kind={subscriptionStatusChipKind(sub.status)} label={subscriptionStatusLabel(sub.status)} caps />
                  </BillingDetailRow>
                  <BillingDetailRow label="Stripe customer">
                    {sub.stripe_customer_linked ? (
                      <span style={{ color: "rgba(74,222,128,0.9)" }}>Linked</span>
                    ) : (
                      <span style={{ color: "rgba(245,247,250,0.55)" }}>Not linked</span>
                    )}
                  </BillingDetailRow>
                  <BillingDetailRow label="Stripe subscription">
                    {sub.stripe_subscription_linked ? (
                      <span style={{ color: "rgba(74,222,128,0.9)" }}>Synced</span>
                    ) : (
                      <span style={{ color: "rgba(245,247,250,0.55)" }}>Not synced</span>
                    )}
                  </BillingDetailRow>
                  {periodCaption ? (
                    <BillingDetailRow label="Schedule">
                      <span style={{ color: "rgba(245,247,250,0.78)" }}>{periodCaption}</span>
                    </BillingDetailRow>
                  ) : null}
                  <div style={{ borderBottom: "none", paddingTop: 4 }} />
                </div>
              )}

              <div
                style={{
                  marginTop: 14,
                  paddingTop: 14,
                  borderTop: "1px solid rgba(255,255,255,0.06)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                }}
              >
                <p className="pf-muted-copy" style={{ margin: 0, fontSize: 11, lineHeight: 1.45 }}>
                  Manage payment methods, invoices, and cancellation in Stripe using the billing portal when it is
                  available for this workspace.
                </p>
                {actionError ? (
                  <p className="pf-muted-copy" style={{ margin: 0, fontSize: 12, color: "rgba(248,113,113,0.92)" }}>
                    {actionError}
                  </p>
                ) : null}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
                  <button
                    type="button"
                    disabled={!data.billing_portal_available || portalLoading}
                    title={!data.billing_portal_available ? "Billing portal is not available yet" : undefined}
                    onClick={() => void openPortal()}
                    style={{
                      borderRadius: 10,
                      border: "1px solid rgba(255,255,255,0.12)",
                      background:
                        data.billing_portal_available && !portalLoading ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.04)",
                      color:
                        data.billing_portal_available && !portalLoading ? "var(--pf-text-primary)" : "rgba(245,247,250,0.45)",
                      padding: "9px 14px",
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: data.billing_portal_available && !portalLoading ? "pointer" : "not-allowed",
                    }}
                  >
                    {portalLoading ? "Opening…" : "Open billing portal"}
                  </button>
                  <button
                    type="button"
                    disabled={!data.subscription_checkout_available || checkoutLoading}
                    title={!data.subscription_checkout_available ? "Subscription checkout is not available yet" : undefined}
                    onClick={() => void startCheckout()}
                    style={{
                      borderRadius: 10,
                      border: "1px solid rgba(255,255,255,0.12)",
                      background:
                        data.subscription_checkout_available && !checkoutLoading
                          ? "rgba(255,255,255,0.08)"
                          : "rgba(255,255,255,0.04)",
                      color:
                        data.subscription_checkout_available && !checkoutLoading
                          ? "var(--pf-text-primary)"
                          : "rgba(245,247,250,0.45)",
                      padding: "9px 14px",
                      fontSize: 12,
                      fontWeight: 600,
                      cursor:
                        data.subscription_checkout_available && !checkoutLoading ? "pointer" : "not-allowed",
                    }}
                  >
                    {checkoutLoading ? "Starting…" : "Start subscription"}
                  </button>
                </div>
                {data.billing_portal_available || data.subscription_checkout_available ? null : (
                  <p className="pf-muted-copy" style={{ margin: 0, fontSize: 11 }}>
                    Portal and subscription checkout activate when the API has Stripe keys, a dashboard URL, and billing
                    routes enabled.
                  </p>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </OperatorPageTransition>
    </main>
  );
}
