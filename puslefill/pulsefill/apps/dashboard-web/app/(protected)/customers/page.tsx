"use client";

import Link from "next/link";
import { useCallback, useEffect, useLayoutEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { DeskHeroCard } from "@/components/dashboard/desk/desk-hero-card";
import { DeskPageHeader } from "@/components/dashboard/desk/desk-page-header";
import { DeskSecondaryCard } from "@/components/dashboard/desk/desk-secondary-card";
import { OperatorPageTransition } from "@/components/operator/operator-page-transition";
import { MotionAction, MotionTapSurface } from "@/components/operator/operator-motion-primitives";
import { OperatorMetricStrip } from "@/components/operator/operator-metric-strip";
import { OperatorRow, OperatorRowList } from "@/components/operator/operator-row-list";
import { OperatorStatusChip } from "@/components/operator/operator-status-chip";
import type { OperatorStatusKind } from "@/components/operator/operator-status-chip";
import { OperatorLoadingState } from "@/components/operator/operator-loading-state";
import { OperatorErrorState } from "@/components/operator/operator-error-state";
import { actionLinkStyle } from "@/lib/operator-action-link-styles";
import { StandbyCoveragePanel } from "@/components/customers/standby-coverage-panel";
import { usePendingStandbyRequests } from "@/hooks/usePendingStandbyRequests";
import { useStandbyCoverage } from "@/hooks/useStandbyCoverage";
import { useBillingSummary } from "@/hooks/useBillingSummary";
import { BillingInlineGuardrail } from "@/components/billing/billing-inline-guardrail";
import { apiFetch } from "@/lib/api";
import type {
  CustomerInviteCreateResponse,
  CustomerInviteListItem,
  CustomerInviteListResponse,
  InviteOnboardingStatusKey,
} from "@/types/customer-invites";

type InviteListFilter = "all" | "pending" | "needs_standby" | "not_reachable" | "active";

/** Resolve onboarding key for counting when older responses omit `onboarding_status`. */
function stripOnboardingKey(item: CustomerInviteListItem): InviteOnboardingStatusKey | null {
  const k = item.onboarding_status?.key;
  if (k) return k;
  if (item.status === "pending") return "pending_invite";
  return null;
}

function OnboardingPlaybook() {
  const rowStyle: CSSProperties = {
    paddingTop: 10,
    borderTop: "1px solid rgba(255,255,255,0.06)",
  };
  const kicker: CSSProperties = {
    fontSize: 12,
    letterSpacing: "0.02em",
    textTransform: "none",
    color: "rgba(201, 191, 179, 0.88)",
    fontWeight: 650,
    margin: 0,
  };
  const body: CSSProperties = {
    margin: "5px 0 0",
    fontSize: 12,
    lineHeight: 1.45,
    color: "rgba(245,247,250,0.78)",
  };
  const action: CSSProperties = {
    margin: "5px 0 0",
    fontSize: 11,
    lineHeight: 1.45,
    color: "rgba(245,247,250,0.52)",
  };

  return (
    <details
      className="pf-onboarding-playbook pf-onboarding-playbook--subtle"
      style={{
        borderRadius: 12,
        border: "1px solid rgba(255,255,255,0.055)",
        background: "linear-gradient(180deg, rgba(22,20,18,0.97), rgba(12,11,10,0.94))",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.035), 0 4px 18px rgba(0,0,0,0.2)",
      }}
    >
      <summary
        style={{
          cursor: "pointer",
          userSelect: "none",
        }}
      >
        How invite statuses work
      </summary>
      <div className="pf-onboarding-playbook__body" style={{ padding: "2px 12px 12px" }}>
        <p className="pf-muted-copy" style={{ margin: "0 0 4px", fontSize: 12, lineHeight: 1.5 }}>
          Use this to move invited customers from &quot;sent invite&quot; to &quot;ready for openings.&quot;
        </p>
        <div style={{ ...rowStyle, paddingTop: 12, borderTop: "none" }}>
          <p style={kicker}>Pending</p>
          <p style={body}>Customer has not accepted the invite yet.</p>
          <p style={action}>
            <span style={{ color: "rgba(245,247,250,0.42)" }}>Action: </span>
            Copy the invite link or reminder message.
          </p>
        </div>
        <div style={rowStyle}>
          <p style={kicker}>Needs standby</p>
          <p style={body}>Customer accepted but has not set standby preferences.</p>
          <p style={action}>
            <span style={{ color: "rgba(245,247,250,0.42)" }}>Action: </span>
            Ask them to open PulseFill and choose the openings they want.
          </p>
        </div>
        <div style={rowStyle}>
          <p style={kicker}>Not reachable</p>
          <p style={body}>Customer is on standby, but alerts may not reach them.</p>
          <p style={action}>
            <span style={{ color: "rgba(245,247,250,0.42)" }}>Action: </span>
            Ask them to enable notifications or confirm their email/SMS.
          </p>
        </div>
        <div style={rowStyle}>
          <p style={kicker}>Active</p>
          <p style={body}>Customer is connected, on standby, and reachable.</p>
          <p style={action}>
            <span style={{ color: "rgba(245,247,250,0.42)" }}>Action: </span>
            Ready for matching openings.
          </p>
        </div>
      </div>
    </details>
  );
}

function inviteOnboardingCounts(invites: CustomerInviteListItem[]) {
  let pending = 0;
  let needsStandby = 0;
  let notReachable = 0;
  let active = 0;
  for (const item of invites) {
    const key = stripOnboardingKey(item);
    if (key === "pending_invite") pending += 1;
    else if (key === "accepted_needs_standby") needsStandby += 1;
    else if (key === "accepted_not_reachable" || key === "accepted_limited_reach") notReachable += 1;
    else if (key === "accepted_standby_active") active += 1;
  }
  return { pending, needsStandby, notReachable, active };
}

function buildInviteNudgeMessage(kind: "pending" | "needs_standby" | "reachability", invite: CustomerInviteListItem): string {
  const first = invite.customer_name?.trim()?.split(/\s+/)[0];
  const greeting = first ? `Hi ${first}` : "Hi";
  if (kind === "pending") {
    const link = invite.invite_url?.trim();
    const linkPart = link ? `\n\n${link}` : "";
    return `${greeting},\n\nHere's your PulseFill invite link. Once you join, set your standby preferences so we can notify you about openings.${linkPart}\n\nThanks!`;
  }
  if (kind === "needs_standby") {
    return `${greeting},\n\nYou're connected on PulseFill — please open the app and finish your standby preferences (which openings you want) so we can match you when slots open.\n\nThanks!`;
  }
  return `${greeting},\n\nPlease enable notifications for PulseFill and confirm SMS/email in your profile if needed, so we can alert you about openings.\n\nThanks!`;
}

function matchesInviteListFilter(item: CustomerInviteListItem, filter: InviteListFilter): boolean {
  if (filter === "all") return true;
  const key = item.onboarding_status?.key;
  if (filter === "pending") return key === "pending_invite";
  if (filter === "needs_standby") return key === "accepted_needs_standby";
  if (filter === "not_reachable") {
    return key === "accepted_not_reachable" || key === "accepted_limited_reach";
  }
  if (filter === "active") return key === "accepted_standby_active";
  return true;
}

function onboardingToneToKind(tone: string | undefined): OperatorStatusKind {
  switch (tone) {
    case "success":
      return "confirmed";
    case "attention":
      return "attention";
    case "warning":
      return "pending";
    case "muted":
      return "inactive";
    default:
      return "inactive";
  }
}

const INVITES_API = "/v1/businesses/mine/customer-invites";

async function copyToClipboard(value: string): Promise<void> {
  if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
    throw new Error("Clipboard not available");
  }
  await navigator.clipboard.writeText(value);
}

function inviteStatusLabel(status: string): string {
  if (status === "pending") return "Pending";
  if (status === "accepted") return "Accepted";
  if (status === "expired") return "Expired";
  if (status === "revoked") return "Revoked";
  return status;
}

function inviteStatusChipKind(status: string): OperatorStatusKind {
  if (status === "pending") return "pending";
  if (status === "accepted") return "confirmed";
  if (status === "expired") return "expired";
  if (status === "revoked") return "cancelled";
  return "inactive";
}

export default function CustomersPage() {
  function toCustomerInviteError(err: unknown, fallback: string): string {
    if (!(err instanceof Error)) return fallback;
    const msg = err.message.trim();
    const lower = msg.toLowerCase();
    if (lower.includes("not found")) return "Customer invites are not available yet.";
    return msg.length > 0 ? msg : fallback;
  }

  const [customerName, setCustomerName] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [invites, setInvites] = useState<CustomerInviteListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [lastCreated, setLastCreated] = useState<CustomerInviteCreateResponse | null>(null);
  const [copyState, setCopyState] = useState<string | null>(null);
  const [revokeBusyId, setRevokeBusyId] = useState<string | null>(null);
  const [rowCopyId, setRowCopyId] = useState<string | null>(null);
  const [inviteFilter, setInviteFilter] = useState<InviteListFilter>("all");
  const standbyPending = usePendingStandbyRequests(60_000);
  const billingSummary = useBillingSummary();
  const { data: standbyCoverage, loading: coverageLoading, error: coverageError, reload: reloadCoverage } =
    useStandbyCoverage();
  const reduceMotion = useReducedMotion();
  const pendingInvites = invites.filter((i) => i.status === "pending").length;
  const acceptedInvites = invites.filter((i) => i.status === "accepted").length;
  const onboardingCounts = inviteOnboardingCounts(invites);
  const filteredInvites = invites.filter((r) => matchesInviteListFilter(r, inviteFilter));

  useLayoutEffect(() => {
    if (typeof window === "undefined") return;
    if (window.location.hash !== "#invite-customer") return;
    const el = document.getElementById("invite-customer");
    if (el) {
      requestAnimationFrame(() => {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  }, []);

  const poolHint = useMemo(() => {
    if (coverageLoading) return "Loading who can hear from you…";
    if (coverageError) return "Couldn’t load coverage — use Retry in the panel.";
    if (!standbyCoverage) return "Coverage numbers show up here once loaded.";
    const e = standbyCoverage.eligible_customer_count;
    const r = standbyCoverage.reachable_customer_count;
    if (e === 0) {
      return acceptedInvites > 0
        ? "Customers are connected — have them finish their preferences so they can get offers."
        : "Invite people first, then make sure they accept and turn on how they want to hear from you.";
    }
    if (r < e) {
      return `${e} ready for openings · ${r} can be reached right now — some people still need text or email turned on.`;
    }
    if (standbyCoverage.uncovered_services.length > 0) {
      return `${e} ready — a few services don’t have anyone watching yet; widen preferences or invite more people.`;
    }
    return `${e} customers can get openings, and they can all be reached.`;
  }, [coverageLoading, coverageError, standbyCoverage, acceptedInvites]);

  const needsSetupCount = useMemo(() => {
    if (coverageLoading || !standbyCoverage) return null;
    return (standbyCoverage.unreachable_eligible_count ?? 0) + (standbyCoverage.customers_pending_membership ?? 0);
  }, [coverageLoading, standbyCoverage]);

  const load = useCallback(async () => {
    try {
      setListError(null);
      setLoading(true);
      const data = await apiFetch<CustomerInviteListResponse>(INVITES_API);
      setInvites(Array.isArray(data.invites) ? data.invites : []);
    } catch (err) {
      setListError(toCustomerInviteError(err, "Couldn’t load invites. Please try again."));
      setInvites([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function revokeInvite(inviteId: string) {
    setRevokeBusyId(inviteId);
    try {
      await apiFetch<{ invite: CustomerInviteListItem }>(`${INVITES_API}/${inviteId}/revoke`, { method: "POST" });
      await load();
    } catch (err) {
      setListError(toCustomerInviteError(err, "Couldn’t revoke invite."));
    } finally {
      setRevokeBusyId(null);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setLastCreated(null);
    if (!email.trim()) {
      setFormError("Enter an email address.");
      return;
    }
    setSaving(true);
    try {
      const payload: { email: string; customer_name?: string } = { email: email.trim() };
      const nm = customerName.trim();
      if (nm) payload.customer_name = nm;
      const res = await apiFetch<CustomerInviteCreateResponse>(INVITES_API, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setLastCreated(res);
      setCopyState(null);
      setEmail("");
      setCustomerName("");
      await load();
    } catch (err) {
      setFormError(toCustomerInviteError(err, "Couldn’t create invite. Please try again."));
    } finally {
      setSaving(false);
    }
  }

  const resetInviteForm = useCallback(() => {
    setFormError(null);
    setEmail("");
    setCustomerName("");
  }, []);

  const dismissInviteSuccess = useCallback(() => {
    setLastCreated(null);
    setCopyState(null);
  }, []);

  const headerActions = (
    <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", justifyContent: "flex-end" }}>
      {standbyPending.count > 0 ? (
        reduceMotion ? (
          <Link href="/customers/standby-requests" className="pf-desk-quiet-link" style={{ marginTop: 0 }}>
            Waitlist requests →
          </Link>
        ) : (
          <motion.span
            animate={{ opacity: [1, 0.88, 1] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
            style={{ display: "inline-block" }}
          >
            <Link href="/customers/standby-requests" className="pf-desk-quiet-link" style={{ marginTop: 0 }}>
              Waitlist requests →
            </Link>
          </motion.span>
        )
      ) : (
        <Link href="/customers/standby-requests" className="pf-desk-quiet-link" style={{ marginTop: 0 }}>
          Waitlist requests →
        </Link>
      )}
    </div>
  );

  return (
    <main className="pf-page-customers pf-desk-page" style={{ padding: 0 }}>
      <OperatorPageTransition>
        <div className="pf-overview-desk-stack">
          <DeskPageHeader title="Customers" subtitle="Invite customers so they can get openings when someone cancels." actions={headerActions} />

          <DeskHeroCard title="Build your waiting list" titleId="pf-customers-hero-title" eyebrow="Waiting customers">
            <p className="pf-desk-hero-card__meta">
              Send an invite link to customers you want on your waiting list. When someone cancels, they can get a shot
              at the opening.
            </p>
            <p className="pf-muted-copy" style={{ margin: 0, fontSize: 12, lineHeight: 1.45 }}>
              People can also ask to join — use waitlist requests when you approve them.
            </p>
            <MotionAction>
              <Link href="#invite-customer" className="pf-desk-save-access pf-desk-save-access--link">
                Invite customer
              </Link>
            </MotionAction>
          </DeskHeroCard>

          <div className="pf-desk-customers-metrics">
            <DeskSecondaryCard title="Invited">
              <p className="pf-desk-customers-metric-value">{pendingInvites}</p>
              <p className="pf-muted-copy" style={{ margin: 0, fontSize: 12, lineHeight: 1.45 }}>
                Waiting on them to join
              </p>
            </DeskSecondaryCard>
            <DeskSecondaryCard title="Ready for openings">
              <p className="pf-desk-customers-metric-value">{coverageLoading ? "—" : (standbyCoverage?.eligible_customer_count ?? "—")}</p>
              <p className="pf-muted-copy" style={{ margin: 0, fontSize: 12, lineHeight: 1.45 }}>
                Joined and set up to hear from you
              </p>
            </DeskSecondaryCard>
            <DeskSecondaryCard title="Can be reached">
              <p className="pf-desk-customers-metric-value">{coverageLoading ? "—" : (standbyCoverage?.reachable_customer_count ?? "—")}</p>
              <p className="pf-muted-copy" style={{ margin: 0, fontSize: 12, lineHeight: 1.45 }}>
                Can get texts or emails when you send offers
              </p>
            </DeskSecondaryCard>
            <DeskSecondaryCard title="Needs setup">
              <p className="pf-desk-customers-metric-value">{coverageLoading ? "—" : (needsSetupCount ?? "—")}</p>
              <p className="pf-muted-copy" style={{ margin: 0, fontSize: 12, lineHeight: 1.45 }}>
                Finish preferences or membership
              </p>
            </DeskSecondaryCard>
          </div>

          <p className="pf-muted-copy" style={{ margin: 0, fontSize: 13, lineHeight: 1.5 }}>
            {poolHint}
          </p>

          <div className="pf-desk-customers-split">
            <DeskSecondaryCard title={lastCreated ? "Invite sent" : "Invite customer"}>
              <div id="invite-customer">
                {!billingSummary.loading && billingSummary.data ? (
                  <BillingInlineGuardrail summary={billingSummary.data} />
                ) : null}

                {lastCreated ? (
                  <div className="pf-desk-invite-success">
                    <p className="pf-section-title" style={{ margin: 0, fontSize: 18, fontWeight: 650, letterSpacing: "-0.02em" }}>
                      Invite sent
                    </p>
                    <p className="pf-muted-copy" style={{ margin: 0, fontSize: 15, lineHeight: 1.55 }}>
                      The customer can now join your waitlist and set their preferences.
                    </p>
                    <p className="pf-muted-copy" style={{ margin: 0, fontSize: 13, lineHeight: 1.5 }}>
                      For <strong style={{ color: "var(--pf-text-primary)", fontWeight: 650 }}>{lastCreated.customer_email}</strong>
                      {lastCreated.customer_name ? (
                        <>
                          {" "}
                          · {lastCreated.customer_name}
                        </>
                      ) : null}
                    </p>
                    {lastCreated.invite_url ? (
                      <p className="pf-desk-invite-success__url">{lastCreated.invite_url}</p>
                    ) : (
                      <p className="pf-muted-copy" style={{ margin: 0, fontSize: 13 }}>
                        Invite link is not available in this environment. You can still copy the invite code below.
                      </p>
                    )}
                    <div className="pf-desk-invite-actions">
                      {lastCreated.invite_url ? (
                        <button
                          type="button"
                          className="pf-desk-invite-copy-btn"
                          onClick={async () => {
                            try {
                              await copyToClipboard(lastCreated.invite_url!);
                              setCopyState("url");
                            } catch {
                              setCopyState(null);
                            }
                          }}
                        >
                          {copyState === "url" ? "Copied" : "Copy invite link"}
                        </button>
                      ) : null}
                      <button
                        type="button"
                        className="pf-desk-invite-copy-btn"
                        onClick={async () => {
                          try {
                            await copyToClipboard(lastCreated.code ?? lastCreated.one_time_token);
                            setCopyState("token");
                          } catch {
                            setCopyState(null);
                          }
                        }}
                      >
                        {copyState === "token" ? "Copied" : "Copy invite code"}
                      </button>
                      <MotionTapSurface>
                        <button type="button" className="pf-desk-confirm-modal__btn-quiet" onClick={dismissInviteSuccess}>
                          Done
                        </button>
                      </MotionTapSurface>
                    </div>
                  </div>
                ) : (
                  <form className="pf-desk-customers-invite-form" onSubmit={onSubmit}>
                    <p className="pf-muted-copy" style={{ margin: 0, fontSize: 15, lineHeight: 1.55 }}>
                      Send an invite so this customer can receive openings when someone cancels.
                    </p>
                    <label className="pf-desk-invite-label" htmlFor="pf-invite-email">
                      Customer email
                      <span className="pf-desk-invite-label__hint">Required — we send the invite here.</span>
                      <input
                        id="pf-invite-email"
                        className="pf-desk-invite-input"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@example.com"
                        autoComplete="email"
                        required
                      />
                    </label>
                    <label className="pf-desk-invite-label" htmlFor="pf-invite-name">
                      Name (optional)
                      <span className="pf-desk-invite-label__hint">Shown in your invite list so staff recognize who it is.</span>
                      <input
                        id="pf-invite-name"
                        className="pf-desk-invite-input"
                        type="text"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="e.g. Alex Chen"
                        autoComplete="name"
                      />
                    </label>

                    {formError ? (
                      <div className="pf-desk-invite-error" role="alert">
                        <p className="pf-desk-hero-card__eyebrow" style={{ margin: 0 }}>
                          Invite did not send
                        </p>
                        <p className="pf-muted-copy" style={{ margin: "8px 0 0", fontSize: 14, lineHeight: 1.55 }}>
                          Check the email and try again.
                        </p>
                        <p className="pf-muted-copy" style={{ margin: "6px 0 0", fontSize: 13, lineHeight: 1.45 }}>
                          {formError}
                        </p>
                        <div style={{ marginTop: 12 }}>
                          <MotionTapSurface>
                            <button type="button" className="pf-desk-confirm-modal__btn-quiet" onClick={() => setFormError(null)}>
                              Try again
                            </button>
                          </MotionTapSurface>
                        </div>
                      </div>
                    ) : null}

                    <div className="pf-desk-invite-actions">
                      <MotionTapSurface disabled={saving}>
                        <button type="submit" disabled={saving} className="pf-desk-save-access pf-desk-invite-submit">
                          {saving ? "Sending…" : "Send invite"}
                        </button>
                      </MotionTapSurface>
                      <MotionTapSurface disabled={saving}>
                        <button
                          type="button"
                          className="pf-desk-confirm-modal__btn-quiet"
                          disabled={saving}
                          onClick={resetInviteForm}
                        >
                          Cancel
                        </button>
                      </MotionTapSurface>
                    </div>
                  </form>
                )}
              </div>
            </DeskSecondaryCard>

            <DeskSecondaryCard title="Customer coverage">
              <StandbyCoveragePanel
                embedded
                data={standbyCoverage}
                loading={coverageLoading}
                error={coverageError}
                onRetry={() => void reloadCoverage()}
              />
            </DeskSecondaryCard>
          </div>

          <DeskSecondaryCard title="Invites">
            <OnboardingPlaybook />
            {!loading && !listError && invites.length > 0 ? (
              <OperatorMetricStrip
                compact
                stripClassName="pf-onboarding-metric-strip--customers"
                items={[
                  {
                    label: "Pending",
                    value: onboardingCounts.pending,
                    emphasis: onboardingCounts.pending > 0 ? "primary" : "default",
                    signal: onboardingCounts.pending > 0 ? "live" : "idle",
                    hint: "Awaiting acceptance",
                    onClick: () => setInviteFilter("pending"),
                    ariaLabel: "Show pending invites",
                    ariaPressed: inviteFilter === "pending",
                  },
                  {
                    label: "Needs standby",
                    value: onboardingCounts.needsStandby,
                    emphasis: onboardingCounts.needsStandby > 0 ? "primary" : "default",
                    signal: onboardingCounts.needsStandby > 0 ? "live" : "idle",
                    hint: "Connected, no prefs",
                    onClick: () => setInviteFilter("needs_standby"),
                    ariaLabel: "Show invites that need standby setup",
                    ariaPressed: inviteFilter === "needs_standby",
                  },
                  {
                    label: "Not reachable",
                    value: onboardingCounts.notReachable,
                    emphasis: onboardingCounts.notReachable > 0 ? "primary" : "default",
                    signal: onboardingCounts.notReachable > 0 ? "live" : "idle",
                    hint: "Reach gaps",
                    onClick: () => setInviteFilter("not_reachable"),
                    ariaLabel: "Show invites that are not reachable or have limited reach",
                    ariaPressed: inviteFilter === "not_reachable",
                  },
                  {
                    label: "Active",
                    value: onboardingCounts.active,
                    emphasis: onboardingCounts.active > 0 ? "primary" : "default",
                    signal: onboardingCounts.active > 0 ? "live" : "idle",
                    hint: "Standby + reachable",
                    onClick: () => setInviteFilter("active"),
                    ariaLabel: "Show active standby invites",
                    ariaPressed: inviteFilter === "active",
                  },
                ]}
              />
            ) : null}
            {!loading && !listError && invites.length > 0 ? (
              <div className="pf-invite-filter-pills" role="tablist" aria-label="Filter invites by onboarding">
                {(
                  [
                    ["all", "All"],
                    ["pending", "Pending"],
                    ["needs_standby", "Needs standby"],
                    ["not_reachable", "Not reachable"],
                    ["active", "Active"],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    role="tab"
                    aria-selected={inviteFilter === id}
                    onClick={() => setInviteFilter(id)}
                    style={{
                      borderRadius: 999,
                      border:
                        inviteFilter === id
                          ? "1px solid rgba(249,115,22,0.55)"
                          : "1px solid rgba(255,255,255,0.12)",
                      background:
                        inviteFilter === id ? "rgba(249,115,22,0.14)" : "rgba(255,255,255,0.05)",
                      color: "var(--text)",
                      padding: "6px 12px",
                      fontSize: 12,
                      fontWeight: inviteFilter === id ? 650 : 500,
                      cursor: "pointer",
                      lineHeight: 1.2,
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            ) : null}
            {loading ? <OperatorLoadingState variant="section" skeleton="rows" title="Loading invites…" /> : null}
            {listError ? (
              <div style={{ marginTop: 8 }}>
                <OperatorErrorState rawMessage={listError} />
                <button type="button" className="pf-desk-ghost-btn" style={{ marginTop: 8 }} onClick={() => void load()}>
                  Retry
                </button>
              </div>
            ) : null}

            {!loading && !listError && invites.length === 0 ? (
              <div className="pf-customers-invites-empty" style={{ borderRadius: 12, padding: "14px 16px", border: "1px solid rgba(255,246,235,0.06)", background: "rgba(0,0,0,0.12)" }}>
                <p className="pf-customers-invites-empty__title">No invites yet</p>
                <p className="pf-customers-invites-empty__copy pf-muted-copy" style={{ color: "var(--muted)" }}>
                  Create an invite above for a link and code. Accepted customers show onboarding status and a link to
                  Customer 360.
                </p>
              </div>
            ) : null}

            {!loading && !listError && invites.length > 0 && filteredInvites.length === 0 ? (
              <p className="pf-customers-invites__filter-empty pf-muted-copy">No invites in this filter.</p>
            ) : null}

            {!loading && !listError && invites.length > 0 ? (
              <OperatorRowList density="compact">
                {filteredInvites.map((r) => {
                  const title = r.customer_name?.trim() || r.customer_email;
                  const titleFull = title;
                  const onboard = r.onboarding_status;
                  const meta = (
                    <div style={{ fontSize: 12, color: "rgba(245,247,250,0.78)", lineHeight: 1.45, minWidth: 0 }}>
                      {r.customer_name?.trim() ? (
                        <span className="pf-truncate-1" style={{ color: "var(--muted)" }} title={r.customer_email}>
                          {r.customer_email}
                        </span>
                      ) : null}
                      <span style={{ display: "block", marginTop: 4 }}>
                        Created {new Date(r.created_at).toLocaleString()}
                        {r.status === "pending" ? ` · Expires ${new Date(r.expires_at).toLocaleString()}` : null}
                        {r.accepted_at ? ` · Accepted ${new Date(r.accepted_at).toLocaleString()}` : null}
                      </span>
                      {onboard?.detail ? (
                        <span
                          style={{
                            display: "block",
                            marginTop: 6,
                            fontSize: 11,
                            color: "var(--muted)",
                            maxWidth: 420,
                            lineHeight: 1.4,
                          }}
                        >
                          {onboard.detail}
                        </span>
                      ) : null}
                    </div>
                  );

                  const actions: ReactNode[] = [];
                  if (r.status === "pending") {
                    if (r.invite_url) {
                      actions.push(
                        <button
                          key="copy-url"
                          type="button"
                          onClick={async () => {
                            try {
                              await copyToClipboard(r.invite_url!);
                              setRowCopyId(`${r.id}-url`);
                              setTimeout(() => setRowCopyId(null), 2000);
                            } catch {
                              setRowCopyId(null);
                            }
                          }}
                          style={copyButton}
                        >
                          {rowCopyId === `${r.id}-url` ? "Copied" : "Copy link"}
                        </button>,
                      );
                    }
                    if (r.code) {
                      actions.push(
                        <button
                          key="copy-code"
                          type="button"
                          onClick={async () => {
                            try {
                              await copyToClipboard(r.code!);
                              setRowCopyId(`${r.id}-code`);
                              setTimeout(() => setRowCopyId(null), 2000);
                            } catch {
                              setRowCopyId(null);
                            }
                          }}
                          style={copyButton}
                        >
                          {rowCopyId === `${r.id}-code` ? "Copied" : "Copy code"}
                        </button>,
                      );
                    }
                    actions.push(
                      <button
                        key="nudge-pending"
                        type="button"
                        onClick={async () => {
                          try {
                            await copyToClipboard(buildInviteNudgeMessage("pending", r));
                            setRowCopyId(`${r.id}-nudge-pending`);
                            setTimeout(() => setRowCopyId(null), 2000);
                          } catch {
                            setRowCopyId(null);
                          }
                        }}
                        style={copyButton}
                      >
                        {rowCopyId === `${r.id}-nudge-pending` ? "Copied" : "Copy reminder"}
                      </button>,
                    );
                    actions.push(
                      <MotionTapSurface key="revoke" disabled={revokeBusyId === r.id}>
                        <button
                          type="button"
                          disabled={revokeBusyId === r.id}
                          onClick={() => void revokeInvite(r.id)}
                          style={{
                            ...copyButton,
                            borderColor: "rgba(248,113,113,0.35)",
                            cursor: revokeBusyId === r.id ? "wait" : "pointer",
                          }}
                        >
                          {revokeBusyId === r.id ? "…" : "Revoke"}
                        </button>
                      </MotionTapSurface>,
                    );
                  }
                  if (r.status === "accepted") {
                    const ok = onboard?.key;
                    if (r.accepted_by_customer_id) {
                      actions.push(
                        <MotionAction key="view">
                          <Link href={`/customers/${r.accepted_by_customer_id}`} style={actionLinkStyle("primary")}>
                            View customer
                          </Link>
                        </MotionAction>,
                      );
                      if (ok === "accepted_needs_standby") {
                        actions.push(
                          <button
                            key="nudge-standby"
                            type="button"
                            onClick={async () => {
                              try {
                                await copyToClipboard(buildInviteNudgeMessage("needs_standby", r));
                                setRowCopyId(`${r.id}-nudge-standby`);
                                setTimeout(() => setRowCopyId(null), 2000);
                              } catch {
                                setRowCopyId(null);
                              }
                            }}
                            style={copyButton}
                          >
                            {rowCopyId === `${r.id}-nudge-standby` ? "Copied" : "Copy reminder"}
                          </button>,
                        );
                      }
                      if (ok === "accepted_not_reachable" || ok === "accepted_limited_reach") {
                        actions.push(
                          <button
                            key="nudge-reach"
                            type="button"
                            onClick={async () => {
                              try {
                                await copyToClipboard(buildInviteNudgeMessage("reachability", r));
                                setRowCopyId(`${r.id}-nudge-reach`);
                                setTimeout(() => setRowCopyId(null), 2000);
                              } catch {
                                setRowCopyId(null);
                              }
                            }}
                            style={copyButton}
                          >
                            {rowCopyId === `${r.id}-nudge-reach` ? "Copied" : "Copy reminder"}
                          </button>,
                        );
                      }
                    } else if (onboard?.next_action?.href && onboard.next_action.label) {
                      actions.push(
                        <MotionAction key="onboard-action">
                          <Link href={onboard.next_action.href} style={actionLinkStyle("secondary")}>
                            {onboard.next_action.label}
                          </Link>
                        </MotionAction>,
                      );
                    }
                  }
                  if (r.status === "expired" || r.status === "revoked") {
                    actions.push(
                      <MotionAction key="new">
                        <Link
                          href="#invite-customer"
                          onClick={() => {
                            setEmail(r.customer_email);
                            setCustomerName(r.customer_name?.trim() ?? "");
                          }}
                          style={actionLinkStyle("secondary")}
                        >
                          Create new invite
                        </Link>
                      </MotionAction>,
                    );
                  }

                  return (
                    <OperatorRow
                      key={r.id}
                      title={
                        <span className="pf-truncate-1" title={titleFull}>
                          {title}
                        </span>
                      }
                      meta={meta}
                      status={
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 6,
                            alignItems: "flex-end",
                          }}
                        >
                          <OperatorStatusChip
                            kind={inviteStatusChipKind(r.status)}
                            label={inviteStatusLabel(r.status)}
                          />
                          {onboard ? (
                            <OperatorStatusChip
                              kind={onboardingToneToKind(onboard.tone)}
                              label={onboard.label}
                            />
                          ) : null}
                        </div>
                      }
                      action={
                        actions.length > 0 ? (
                          <div className="pf-invite-row-actions">{actions}</div>
                        ) : undefined
                      }
                    />
                  );
                })}
              </OperatorRowList>
            ) : null}
          </DeskSecondaryCard>
        </div>
      </OperatorPageTransition>
    </main>
  );
}

const copyButton: CSSProperties = {
  borderRadius: 8,
  border: "1px solid rgba(255,255,255,0.18)",
  background: "rgba(255,255,255,0.08)",
  color: "var(--text)",
  padding: "8px 12px",
  fontSize: 12,
  cursor: "pointer",
};
