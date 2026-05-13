"use client";

import Link from "next/link";
import { useMemo } from "react";
import { DeskDl } from "@/components/dashboard/desk/desk-dl";
import { DeskHeroCard } from "@/components/dashboard/desk/desk-hero-card";
import { DeskPageHeader } from "@/components/dashboard/desk/desk-page-header";
import { DeskSecondaryCard } from "@/components/dashboard/desk/desk-secondary-card";
import { signOutAction } from "@/app/actions/auth";
import { useBillingSummary } from "@/hooks/useBillingSummary";
import { useSetupOverviewData } from "@/hooks/useSetupOverviewData";

export type SettingsPageClientProps = {
  displayName: string | null;
  email: string;
  role: string;
  lastSignInAt: string | null;
};

function formatWhen(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return "—";
  }
}

function setupRow(label: string, ok: boolean, href: string) {
  return (
    <div className="pf-desk-dl__row" key={label}>
      <dt className="pf-desk-dl__term">{label}</dt>
      <dd className="pf-desk-dl__detail">
        {ok ? (
          <span style={{ color: "rgba(74, 222, 128, 0.95)" }}>Done</span>
        ) : (
          <Link href={href} className="pf-desk-quiet-link" style={{ marginTop: 0 }}>
            Add {label.toLowerCase()}
          </Link>
        )}
      </dd>
    </div>
  );
}

export function SettingsPageClient({ displayName, email, role, lastSignInAt }: SettingsPageClientProps) {
  const setup = useSetupOverviewData();
  const billing = useBillingSummary();

  const billingLabel = useMemo(() => {
    if (billing.loading) return "Loading…";
    if (billing.error) return "Couldn’t load";
    const sub = billing.data?.subscription;
    if (!sub) return "Not activated";
    return sub.status === "trialing" || sub.status === "active" ? "On" : sub.status.replace(/_/g, " ");
  }, [billing.data?.subscription, billing.error, billing.loading]);

  return (
    <main className="pf-page-settings pf-desk-page">
      <DeskPageHeader
        title="Workspace settings"
        subtitle="Control who can join, how your business appears, and how your team signs in."
      />

      <DeskHeroCard title="Customer access" titleId="pf-settings-access-title" eyebrow="Invite only">
        <p className="pf-desk-hero-card__meta">
          Customers can only join your waiting list when your team sends an invite.
        </p>
        <p className="pf-desk-hero-card__access-line">Access mode: Private — invite only</p>
        <div className="pf-desk-access-row">
          <input type="checkbox" id="pf-settings-directory" disabled aria-disabled="true" />
          <label htmlFor="pf-settings-directory">
            List in customer directory
            <span className="pf-desk-access-row__hint">Directory listing is not configurable in PulseFill web yet.</span>
          </label>
        </div>
        <button type="button" className="pf-desk-save-access" disabled title="No access changes to save right now.">
          Save access
        </button>
        <p className="pf-muted-copy" style={{ margin: 0, fontSize: 12 }}>
          Directory controls are not available on web yet — your workspace stays invite-only.
        </p>
        <Link href="/customers" className="pf-desk-quiet-link">
          Invite customers →
        </Link>
      </DeskHeroCard>

      <div className="pf-desk-secondary-grid">
        <DeskSecondaryCard title="Your account">
          <DeskDl
            rows={[
              { term: "Display name", detail: displayName?.trim() || "—" },
              { term: "Work email", detail: email },
              { term: "Last sign-in", detail: formatWhen(lastSignInAt) },
              {
                term: "Role",
                detail: role ? role.charAt(0).toUpperCase() + role.slice(1) : "—",
              },
            ]}
          />
          <form action={signOutAction}>
            <button type="submit" className="pf-desk-ghost-btn">
              Sign out
            </button>
          </form>
        </DeskSecondaryCard>

        <DeskSecondaryCard title="Business profile">
          <p className="pf-muted-copy" style={{ margin: "0 0 12px" }}>
            PulseFill uses these when matching openings. Add them as you finish setup.
          </p>
          <DeskDl
            rows={[
              { term: "Business name", detail: "—" },
              { term: "Timezone", detail: "—" },
              { term: "Category", detail: "—" },
              { term: "Phone", detail: "—" },
              { term: "Email", detail: email },
              { term: "Website", detail: "—" },
            ]}
          />
        </DeskSecondaryCard>

        <DeskSecondaryCard title="Setup checklist">
          {setup.loading ? (
            <p className="pf-muted-copy" style={{ margin: 0 }}>Loading setup…</p>
          ) : setup.error ? (
            <p className="pf-muted-copy" style={{ margin: 0 }}>
              {setup.error}{" "}
              <button type="button" className="pf-desk-ghost-btn" style={{ marginTop: 8 }} onClick={() => void setup.reload()}>
                Retry loading status
              </button>
            </p>
          ) : (
            <dl className="pf-desk-dl">
              {setupRow("Locations", setup.locationsCount > 0, "/locations")}
              {setupRow("Providers", setup.providersCount > 0, "/providers")}
              {setupRow("Services", setup.servicesCount > 0, "/services")}
              <div className="pf-desk-dl__row">
                <dt className="pf-desk-dl__term">Billing</dt>
                <dd className="pf-desk-dl__detail">
                  <Link href="/billing" className="pf-desk-quiet-link" style={{ marginTop: 0 }}>
                    {billingLabel} →
                  </Link>
                </dd>
              </div>
              <div className="pf-desk-dl__row">
                <dt className="pf-desk-dl__term">Account</dt>
                <dd className="pf-desk-dl__detail">
                  <Link href="/overview" className="pf-desk-quiet-link" style={{ marginTop: 0 }}>
                    Open Today →
                  </Link>
                </dd>
              </div>
            </dl>
          )}
        </DeskSecondaryCard>

        <DeskSecondaryCard title="Security">
          <p className="pf-muted-copy" style={{ margin: "0 0 10px" }}>
            Password and sign out for this browser session.
          </p>
          <Link href="/forgot-password" className="pf-desk-quiet-link">
            Reset password →
          </Link>
          <form action={signOutAction}>
            <button type="submit" className="pf-desk-ghost-btn">
              Sign out
            </button>
          </form>
        </DeskSecondaryCard>
      </div>
    </main>
  );
}
