"use client";

import Link from "next/link";
import { useCallback, useEffect, useLayoutEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { PageCommandHeader } from "@/components/operator/page-command-header";
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
import { operatorSurfaceShell } from "@/lib/operator-surface-styles";
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
    fontSize: 10,
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    color: "rgba(245,247,250,0.45)",
    fontWeight: 600,
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
        Onboarding playbook
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
      setFormError("Email is required.");
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

  return (
    <main className="pf-page-customers" style={{ padding: 0 }}>
      <OperatorPageTransition>
        <div className="pf-customers-page-stack">
          <PageCommandHeader
            tone="default"
            eyebrowTone="plain"
            eyebrow="Customers"
            title="Waiting customers"
            description="Invite customers so they can get openings when someone cancels."
            primaryAction={
              <MotionAction>
                <Link href="#invite-customer" style={actionLinkStyle("primary")}>
                  Invite customer
                </Link>
              </MotionAction>
            }
            secondaryAction={
              standbyPending.count > 0 ? (
                reduceMotion ? (
                  <Link href="/customers/standby-requests" style={actionLinkStyle("secondary")}>
                    Waitlist requests
                  </Link>
                ) : (
                  <motion.span
                    animate={{ opacity: [1, 0.88, 1] }}
                    transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                    style={{ display: "inline-block" }}
                  >
                    <Link href="/customers/standby-requests" style={actionLinkStyle("secondary")}>
                      Waitlist requests
                    </Link>
                  </motion.span>
                )
              ) : (
                <Link href="/customers/standby-requests" style={actionLinkStyle("secondary")}>
                  Waitlist requests
                </Link>
              )
            }
          />

          <div
            style={{
              ...operatorSurfaceShell("quiet"),
              padding: "14px 16px",
              fontSize: 13,
              lineHeight: 1.55,
              color: "rgba(245,247,250,0.78)",
            }}
          >
            <Link href="/customers/standby-requests" style={{ color: "var(--pf-accent-primary)", fontWeight: 600 }}>
              Waitlist requests
            </Link>
            <span style={{ color: "var(--muted)" }}>
              {" "}
              — people who asked to join; approve them if you use request-to-join.
            </span>
          </div>

          <OperatorMetricStrip
            stripClassName="pf-customers-pool-metrics"
            items={[
              {
                label: "Invited",
                value: pendingInvites,
                emphasis: pendingInvites > 0 ? "primary" : "default",
                signal: pendingInvites > 0 ? "live" : "idle",
                hint: "Waiting on them to join",
              },
              {
                label: "Ready for openings",
                value: coverageLoading ? "—" : (standbyCoverage?.eligible_customer_count ?? "—"),
                emphasis:
                  !coverageLoading && standbyCoverage && standbyCoverage.eligible_customer_count > 0 ? "primary" : "default",
                signal:
                  !coverageLoading && standbyCoverage && standbyCoverage.eligible_customer_count > 0 ? "live" : "idle",
                hint: "Joined and set up to hear from you",
              },
              {
                label: "Can be reached",
                value: coverageLoading ? "—" : (standbyCoverage?.reachable_customer_count ?? "—"),
                emphasis:
                  !coverageLoading &&
                  standbyCoverage &&
                  standbyCoverage.reachable_customer_count >= standbyCoverage.eligible_customer_count &&
                  standbyCoverage.eligible_customer_count > 0
                    ? "primary"
                    : "default",
                signal:
                  !coverageLoading &&
                  standbyCoverage &&
                  standbyCoverage.reachable_customer_count > 0 &&
                  standbyCoverage.reachable_customer_count >= standbyCoverage.eligible_customer_count
                    ? "live"
                    : "idle",
                hint: "Reach turned on (push, SMS, or email)",
              },
              {
                label: "Needs setup",
                value: coverageLoading ? "—" : (needsSetupCount ?? "—"),
                emphasis: !coverageLoading && needsSetupCount != null && needsSetupCount > 0 ? "primary" : "default",
                signal: !coverageLoading && needsSetupCount != null && needsSetupCount > 0 ? "live" : "idle",
                hint: "Finish preferences or membership",
              },
            ]}
            compact
          />
          <p className="pf-muted-copy" style={{ margin: 0, fontSize: 12, lineHeight: 1.45 }}>
            {poolHint}
          </p>

          <div className="pf-customers-split" style={{ marginTop: 4 }}>
            <form
              id="invite-customer"
              className="pf-customers-invite-form"
              onSubmit={onSubmit}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 12,
                padding: "20px 20px 22px",
                ...operatorSurfaceShell("operational"),
              }}
            >
              <h2 className="pf-section-title" style={{ fontSize: 16 }}>
                Invite customer
              </h2>
              {!billingSummary.loading && billingSummary.data ? (
                <BillingInlineGuardrail summary={billingSummary.data} />
              ) : null}
              <p className="pf-muted-copy" style={{ margin: 0, fontSize: 13 }}>
                Send an invite so someone can join your list and get openings when a visit cancels.
              </p>
              <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13 }}>
                <span style={{ color: "var(--muted)" }}>Customer name (optional)</span>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Alex Chen"
                  style={{
                    borderRadius: 12,
                    border: "1px solid var(--pf-border-default)",
                    background: "var(--pf-auth-input-bg)",
                    color: "var(--text)",
                    padding: "10px 12px",
                    fontSize: 14,
                    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
                  }}
                />
              </label>
              <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13 }}>
                <span style={{ color: "var(--muted)" }}>Customer email *</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="patients@example.com"
                  required
                  style={{
                    borderRadius: 12,
                    border: "1px solid var(--pf-border-default)",
                    background: "var(--pf-auth-input-bg)",
                    color: "var(--text)",
                    padding: "10px 12px",
                    fontSize: 14,
                    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
                  }}
                />
              </label>
              {formError ? <p style={{ color: "#f87171", margin: 0, fontSize: 13 }}>{formError}</p> : null}
              <MotionTapSurface disabled={saving}>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    borderRadius: 12,
                    border: "1px solid var(--pf-accent-primary-border)",
                    background: "linear-gradient(180deg, #ff7a18 0%, #f97316 100%)",
                    color: "var(--pf-btn-primary-text)",
                    padding: "10px 16px",
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: saving ? "wait" : "pointer",
                    alignSelf: "flex-start",
                    boxShadow: "0 10px 28px rgba(255, 122, 24, 0.28)",
                  }}
                >
                  {saving ? "Creating…" : "Create invite"}
                </button>
              </MotionTapSurface>
            </form>

            <StandbyCoveragePanel
              data={standbyCoverage}
              loading={coverageLoading}
              error={coverageError}
              onRetry={() => void reloadCoverage()}
            />
          </div>

          {lastCreated ? (
            <div
              style={{
                marginTop: 4,
                padding: 16,
                borderRadius: 14,
                border: "1px solid rgba(34,197,94,0.35)",
                background: "rgba(34,197,94,0.08)",
                fontSize: 13,
                lineHeight: 1.5,
                maxWidth: 720,
              }}
            >
              <strong style={{ display: "block", marginBottom: 8 }}>Invite created</strong>
              <p className="pf-muted-copy" style={{ margin: "0 0 8px", fontSize: 12 }}>
                For {lastCreated.customer_email}
                {lastCreated.customer_name ? ` · ${lastCreated.customer_name}` : ""}
              </p>
              {lastCreated.invite_url ? (
                <p style={{ margin: "0 0 8px" }}>
                  <code style={{ wordBreak: "break-all", fontSize: 12 }}>{lastCreated.invite_url}</code>
                </p>
              ) : (
                <p style={{ margin: "0 0 8px", color: "var(--muted)" }}>
                  Invite link unavailable in this environment. You can still copy the invite code below.
                </p>
              )}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
                {lastCreated.invite_url ? (
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await copyToClipboard(lastCreated.invite_url!);
                        setCopyState("url");
                      } catch {
                        setCopyState(null);
                      }
                    }}
                    style={copyButton}
                  >
                    {copyState === "url" ? "Copied" : "Copy invite link"}
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await copyToClipboard(lastCreated.code ?? lastCreated.one_time_token);
                      setCopyState("token");
                    } catch {
                      setCopyState(null);
                    }
                  }}
                  style={copyButton}
                >
                  {copyState === "token" ? "Copied" : "Copy invite code"}
                </button>
              </div>
            </div>
          ) : null}

          <section className="pf-customers-invites" aria-labelledby="customers-invites-heading">
            <h2 id="customers-invites-heading" className="pf-section-title pf-customers-invites__heading" style={{ fontSize: 15 }}>
              Invites
            </h2>
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
                      padding: "5px 11px",
                      fontSize: 11,
                      fontWeight: inviteFilter === id ? 700 : 500,
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
                <button
                  type="button"
                  onClick={() => void load()}
                  style={{
                    marginTop: 8,
                    borderRadius: 8,
                    border: "1px solid rgba(255,255,255,0.14)",
                    background: "rgba(255,255,255,0.06)",
                    color: "var(--text)",
                    padding: "6px 12px",
                    fontSize: 12,
                    cursor: "pointer",
                  }}
                >
                  Retry
                </button>
              </div>
            ) : null}

            {!loading && !listError && invites.length === 0 ? (
              <div className="pf-customers-invites-empty" style={{ ...operatorSurfaceShell("emptyState") }}>
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
                            caps
                          />
                          {onboard ? (
                            <OperatorStatusChip
                              kind={onboardingToneToKind(onboard.tone)}
                              label={onboard.label}
                              caps
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
          </section>
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
