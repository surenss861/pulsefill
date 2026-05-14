"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { signOutAction } from "@/app/actions/auth";
import { ActionButton } from "@/components/ui/action-button";
import { actionLinkStyle } from "@/lib/operator-action-link-styles";
import { DeskFilePage, DeskActionSlip, DeskStatusStamp } from "@/components/dashboard/desk/desk-artifacts";
import { DeskSecondaryCard } from "@/components/dashboard/desk/desk-secondary-card";
import { OperatorPageTransition } from "@/components/operator/operator-page-transition";
import { MotionTapSurface } from "@/components/operator/operator-motion-primitives";
import { PageState } from "@/components/ui/page-state";
import { StatusPill } from "@/components/ui/status-pill";
import { useBusinessMine } from "@/hooks/useBusinessMine";
import { apiFetch } from "@/lib/api";
import type { ProfileRow } from "@/lib/get-current-user";
import type { BusinessMineResponse } from "@/types/business-mine";

function formatWebsiteDisplay(website: string | null | undefined): string | null {
  const w = website?.trim();
  if (!w) return null;
  return w.startsWith("http://") || w.startsWith("https://") ? w : `https://${w}`;
}

function field(label: string, value: string | null | undefined) {
  const v = value?.trim();
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(0, 140px) 1fr",
        gap: "10px 20px",
        padding: "10px 0",
        borderBottom: "1px solid var(--pf-border-subtle)",
        fontSize: 14,
      }}
    >
      <span className="pf-meta-row" style={{ fontWeight: 600, textTransform: "none", letterSpacing: "0.02em" }}>
        {label}
      </span>
      <span style={{ color: "rgba(245, 247, 250, 0.88)", wordBreak: "break-word" }}>{v && v.length > 0 ? v : "—"}</span>
    </div>
  );
}

function roleLabel(role: string) {
  if (!role) return "Operator";
  return role.charAt(0).toUpperCase() + role.slice(1);
}

const selectStyle = {
  maxWidth: 360,
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid var(--pf-border-default)",
  background: "var(--pf-auth-input-bg)",
  color: "var(--text)",
  fontSize: 14,
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
} as const;

export type SettingsPageClientProps = {
  authEmail: string | null;
  profile: ProfileRow;
  lastSignInAt: string | null;
};

export function SettingsPageClient({ authEmail, profile, lastSignInAt }: SettingsPageClientProps) {
  const business = useBusinessMine();
  const [accessMode, setAccessMode] = useState<BusinessMineResponse["standby_access_mode"]>("private");
  const [discovery, setDiscovery] = useState(false);
  const [accessSaving, setAccessSaving] = useState(false);
  const [accessError, setAccessError] = useState<string | null>(null);

  useEffect(() => {
    if (!business.data) return;
    setAccessMode(business.data.standby_access_mode ?? "private");
    setDiscovery(Boolean(business.data.customer_discovery_enabled));
  }, [business.data?.id, business.data?.standby_access_mode, business.data?.customer_discovery_enabled]);

  const displayEmail = authEmail?.trim() || profile.email?.trim() || "—";
  const lastIn =
    lastSignInAt != null && lastSignInAt.length > 0
      ? new Date(lastSignInAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })
      : null;

  return (
    <main className="pf-page-settings pf-desk-page" style={{ padding: 0 }}>
      <OperatorPageTransition>
        <DeskFilePage
          filingLine="06 · Workspace file"
          title="Workspace"
          subtitle={
            <div>
              <p style={{ margin: 0 }}>Account, business details, and how PulseFill runs for your team.</p>
              <p style={{ margin: "10px 0 0", display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                <StatusPill variant="default" caps>
                  {roleLabel(profile.role)}
                </StatusPill>
                <StatusPill variant={profile.onboarding_completed ? "primary" : "default"} caps>
                  {profile.onboarding_completed ? "Ready" : "Setup in progress"}
                </StatusPill>
              </p>
            </div>
          }
          coverAside={
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", justifyContent: "flex-end" }}>
              <DeskStatusStamp live={profile.onboarding_completed} />
              <Link href="/overview" style={actionLinkStyle("secondary")}>
                Back to Today
              </Link>
              <Link href="/forgot-password" style={actionLinkStyle("ghost")}>
                Forgot password
              </Link>
            </div>
          }
        >
          <DeskActionSlip title="Customer access" titleId="pf-settings-access-slip-title" eyebrow="Waitlist">
            {business.loading ? (
              <PageState variant="info" title="Loading" description="Loading workspace…" style={{ maxWidth: "100%" }} />
            ) : business.error ? (
              <PageState variant="error" title="Could not load" description={business.error} style={{ maxWidth: "100%" }} />
            ) : business.data ? (
              <div className="pf-settings-standby-split">
                <div className="pf-settings-standby-split__copy">
                  <p style={{ margin: "0 0 10px" }}>
                    Control how new people join your waitlist. Invite-only stays the default until you turn on discovery.
                  </p>
                  <p style={{ margin: 0 }}>
                    Directory listing is off by default. When on, signed-in customers can see your profile and request access or join (depending
                    on access mode). Pilot flows and invites keep working.
                  </p>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <label style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 13, color: "rgba(245,247,250,0.55)" }}>
                    Access mode
                    <select
                      value={accessMode ?? "private"}
                      onChange={(e) => setAccessMode(e.target.value as BusinessMineResponse["standby_access_mode"])}
                      style={{ ...selectStyle, maxWidth: "100%" }}
                    >
                      <option value="private">Private — invite only</option>
                      <option value="request_to_join">Request to join — customers apply, you approve</option>
                      <option value="public">Public — customers can join standby when listed</option>
                    </select>
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "rgba(245,247,250,0.82)" }}>
                    <input
                      type="checkbox"
                      checked={discovery}
                      onChange={(e) => setDiscovery(e.target.checked)}
                      style={{ width: 18, height: 18 }}
                    />
                    List in customer “Find businesses” directory
                  </label>
                  {accessError ? <p style={{ margin: 0, color: "#f87171", fontSize: 13 }}>{accessError}</p> : null}
                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 4 }}>
                    <MotionTapSurface disabled={accessSaving}>
                      <ActionButton
                        variant="primary"
                        disabled={accessSaving}
                        onClick={() => {
                          void (async () => {
                            setAccessError(null);
                            setAccessSaving(true);
                            try {
                              await apiFetch<BusinessMineResponse>("/v1/businesses/mine", {
                                method: "PATCH",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                  standby_access_mode: accessMode,
                                  customer_discovery_enabled: discovery,
                                }),
                              });
                              await business.reload({ silent: true });
                            } catch (e) {
                              setAccessError(e instanceof Error ? e.message : "Save failed");
                            } finally {
                              setAccessSaving(false);
                            }
                          })();
                        }}
                      >
                        {accessSaving ? "Saving…" : "Save access"}
                      </ActionButton>
                    </MotionTapSurface>
                  </div>
                </div>
              </div>
            ) : (
              <PageState variant="empty" title="No workspace" description="Try refreshing." style={{ maxWidth: "100%" }} />
            )}
          </DeskActionSlip>

          <div className="pf-settings-account-workspace">
            <DeskSecondaryCard variant="slip" title="Account">
              <p className="pf-muted-copy" style={{ margin: "0 0 8px", fontSize: 11, fontWeight: 650, letterSpacing: "0.12em", textTransform: "uppercase" }}>
                Your account
              </p>
              <div style={{ marginTop: 2 }}>{field("Display name", profile.full_name)}</div>
              {field("Work email", displayEmail)}
              {field("Last sign-in", lastIn)}
              <div style={{ marginTop: 12, display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
                <form action={signOutAction} style={{ display: "inline" }}>
                  <ActionButton variant="secondary" type="submit">
                    Sign out
                  </ActionButton>
                </form>
                <span style={{ fontSize: 12, color: "rgba(245, 247, 250, 0.45)" }}>Ends this session on this device.</span>
              </div>
            </DeskSecondaryCard>

            <DeskSecondaryCard variant="slip" title="Business profile">
              <p className="pf-muted-copy" style={{ margin: "0 0 8px", fontSize: 11, fontWeight: 650, letterSpacing: "0.12em", textTransform: "uppercase" }}>
                Workspace
              </p>
              {business.loading ? (
                <PageState variant="info" title="Loading workspace" description="Fetching business from the PulseFill API." style={{ maxWidth: "100%" }} />
              ) : business.error ? (
                <div>
                  <PageState variant="error" title="Could not load workspace" description={business.error} style={{ maxWidth: "100%" }} />
                  <div style={{ marginTop: 14 }}>
                    <ActionButton variant="primary" onClick={() => void business.reload()}>
                      Try again
                    </ActionButton>
                  </div>
                </div>
              ) : business.data ? (
                <div style={{ marginTop: 2 }}>
                  {field("Business name", business.data.name)}
                  {field("Timezone", business.data.timezone)}
                  {field("Category", business.data.category)}
                  {field("Phone", business.data.phone)}
                  {field("Business email", business.data.email)}
                  {field("Website", formatWebsiteDisplay(business.data.website))}
                </div>
              ) : (
                <PageState variant="empty" title="No workspace data" description="Try refreshing the page." style={{ maxWidth: "100%" }} />
              )}
            </DeskSecondaryCard>
          </div>

          <div className="pf-settings-two-col">
            <DeskSecondaryCard variant="slip" title="Setup">
              <p className="pf-muted-copy" style={{ margin: "0 0 10px", fontSize: 11, fontWeight: 650, letterSpacing: "0.12em", textTransform: "uppercase" }}>
                Workspace setup
              </p>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                  gap: 10,
                  marginTop: 2,
                }}
              >
                <Link href="/locations" style={actionLinkStyle("secondary")}>
                  Locations
                </Link>
                <Link href="/providers" style={actionLinkStyle("secondary")}>
                  Providers
                </Link>
                <Link href="/services" style={actionLinkStyle("secondary")}>
                  Services
                </Link>
                <Link href="/billing" style={actionLinkStyle("secondary")}>
                  Billing file
                </Link>
                <Link href="/account" style={actionLinkStyle("secondary")}>
                  Account
                </Link>
              </div>
            </DeskSecondaryCard>

            <DeskSecondaryCard variant="slip" title="Security">
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 2 }}>
                <Link href="/forgot-password" style={actionLinkStyle("secondary")}>
                  Reset password
                </Link>
                <form action={signOutAction} style={{ display: "inline" }}>
                  <ActionButton variant="secondary" type="submit">
                    Sign out
                  </ActionButton>
                </form>
              </div>
            </DeskSecondaryCard>
          </div>
        </DeskFilePage>
      </OperatorPageTransition>
    </main>
  );
}
