"use client";

import Link from "next/link";
import { signOutAction } from "@/app/actions/auth";
import { ActionButton, actionLinkStyle } from "@/components/ui/action-button";
import { PageIntroCard } from "@/components/ui/page-intro-card";
import { PageState } from "@/components/ui/page-state";
import { SectionCard } from "@/components/ui/section-card";
import { StatusPill } from "@/components/ui/status-pill";
import { useBusinessMine } from "@/hooks/useBusinessMine";
import type { ProfileRow } from "@/lib/get-current-user";

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
        padding: "12px 0",
        borderBottom: "1px solid var(--pf-border-subtle)",
        fontSize: 14,
      }}
    >
      <span style={{ color: "rgba(245, 247, 250, 0.45)", fontWeight: 600 }}>{label}</span>
      <span style={{ color: "rgba(245, 247, 250, 0.88)", wordBreak: "break-word" }}>{v && v.length > 0 ? v : "—"}</span>
    </div>
  );
}

function roleLabel(role: string) {
  if (!role) return "Operator";
  return role.charAt(0).toUpperCase() + role.slice(1);
}

export type SettingsPageClientProps = {
  authEmail: string | null;
  profile: ProfileRow;
  lastSignInAt: string | null;
};

export function SettingsPageClient({ authEmail, profile, lastSignInAt }: SettingsPageClientProps) {
  const business = useBusinessMine();
  const displayEmail = authEmail?.trim() || profile.email?.trim() || "—";
  const lastIn =
    lastSignInAt != null && lastSignInAt.length > 0
      ? new Date(lastSignInAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })
      : null;

  return (
    <main style={{ padding: 0, maxWidth: 880 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <PageIntroCard
          tone="elevated"
          layout="split"
          overline="Settings"
          title="Account and workspace settings"
          description="Manage your account and business details used across daily recovery workflows."
          badge={
            <span style={{ display: "inline-flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              <StatusPill variant="default" caps>
                {roleLabel(profile.role)}
              </StatusPill>
              <StatusPill variant={profile.onboarding_completed ? "primary" : "default"} caps>
                {profile.onboarding_completed ? "Ready" : "Setup in progress"}
              </StatusPill>
            </span>
          }
          actions={
            <>
              <Link href="/overview" style={actionLinkStyle("secondary")}>
                Back to overview
              </Link>
              <Link href="/forgot-password" style={actionLinkStyle("ghost")}>
                Forgot password
              </Link>
            </>
          }
        />

        <SectionCard
          eyebrow="Your account"
          title="Account"
          description="Your name, email, role, and sign-in session."
        >
          <div style={{ marginTop: 4 }}>{field("Display name", profile.full_name)}</div>
          {field("Work email", displayEmail)}
          {field("Last sign-in", lastIn)}
          <div style={{ marginTop: 20, display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
            <form action={signOutAction} style={{ display: "inline" }}>
              <ActionButton variant="secondary" type="submit">
                Sign out
              </ActionButton>
            </form>
            <span style={{ fontSize: 13, color: "rgba(245, 247, 250, 0.45)" }}>Ends this session on this device.</span>
          </div>
        </SectionCard>

        <SectionCard
          eyebrow="Workspace"
          title="Workspace"
          description="Business details used across openings and customer invites."
        >
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
            <div style={{ marginTop: 4 }}>
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
        </SectionCard>

        <SectionCard
          eyebrow="Workspace setup"
          title="Setup"
          description="Manage locations, providers, services, billing, and account settings."
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: 10,
              marginTop: 4,
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
              Billing
            </Link>
            <Link href="/account" style={actionLinkStyle("secondary")}>
              Account
            </Link>
          </div>
        </SectionCard>

        <SectionCard
          eyebrow="Security"
          title="Security"
          description="Manage sign-in and session controls."
        >
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            <Link href="/forgot-password" style={actionLinkStyle("secondary")}>
              Reset password
            </Link>
            <form action={signOutAction} style={{ display: "inline" }}>
              <ActionButton variant="secondary" type="submit">
                Sign out
              </ActionButton>
            </form>
          </div>
        </SectionCard>

      </div>
    </main>
  );
}
