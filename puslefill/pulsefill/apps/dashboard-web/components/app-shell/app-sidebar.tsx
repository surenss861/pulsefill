"use client";

import { LayoutGroup } from "framer-motion";
import type { CSSProperties } from "react";
import Link from "next/link";
import type { ProfileRow } from "@/lib/get-current-user";
import { useLiveCounts } from "@/hooks/useLiveCounts";
import { usePendingStandbyRequests } from "@/hooks/usePendingStandbyRequests";
import { AppNavItem } from "./app-nav-item";
import { PulseFillWordmark } from "./pulse-fill-wordmark";
import {
  NavIconActivity,
  NavIconBilling,
  NavIconCommandCenter,
  NavIconCustomers,
  NavIconOpenings,
  NavIconSettings,
} from "./nav-dock-icons";

type AppSidebarProps = {
  profile: ProfileRow;
};

const deskFilesNav = [
  { href: "/overview", label: "Today", icon: <NavIconCommandCenter /> },
  { href: "/open-slots", label: "Appointment files", icon: <NavIconOpenings /> },
  { href: "/customers", label: "Waitlist", icon: <NavIconCustomers /> },
  { href: "/activity", label: "Log", icon: <NavIconActivity /> },
] as const;

const workspaceNav = [
  { href: "/settings", label: "Workspace", icon: <NavIconSettings /> },
  { href: "/billing", label: "Billing file", icon: <NavIconBilling /> },
] as const;

const badgeBase: CSSProperties = {
  marginLeft: "auto",
  borderRadius: 999,
  padding: "2px 8px",
  fontSize: 11,
  fontWeight: 600,
  border: "1px solid",
};

function truncateEmail(email: string, max = 32): string {
  const t = email.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

export function AppSidebar({ profile }: AppSidebarProps) {
  const counts = useLiveCounts();
  const standbyPending = usePendingStandbyRequests(60_000);
  const live = profile.onboarding_completed;

  const emberBadge: CSSProperties = {
    ...badgeBase,
    flexShrink: 0,
    background: "rgba(255, 122, 24, 0.1)",
    borderColor: "rgba(255, 122, 24, 0.28)",
    color: "#fdba74",
  };

  const emberBadgeMuted: CSSProperties = {
    ...badgeBase,
    flexShrink: 0,
    background: "rgba(255, 122, 24, 0.06)",
    borderColor: "rgba(255, 160, 90, 0.2)",
    color: "rgba(254, 200, 170, 0.88)",
  };

  return (
    <aside
      className="pf-app-sidebar pf-dock-rail"
      style={{
        width: 280,
        flexShrink: 0,
        borderRight: "1px solid var(--pf-border-subtle)",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div className="pf-sidebar-brand pf-sidebar-brand--wordmark">
        <PulseFillWordmark />
      </div>

      <div className="pf-sidebar-context-line">
        <p className="pf-sidebar-context-line__email">{truncateEmail(profile.email ?? "", 38)}</p>
      </div>

      <LayoutGroup id="pf-primary-sidebar-nav">
        <nav className="pf-sidebar-nav">
          <p className="pf-kicker pf-sidebar-nav__kicker pf-sidebar-nav__kicker--desk">Desk files</p>
          {deskFilesNav.map((item) => (
            <div key={item.href} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <AppNavItem href={item.href} label={item.label} icon={item.icon} />
              </div>
              {item.href === "/open-slots" && counts.open > 0 ? <span style={emberBadge}>{counts.open}</span> : null}
              {item.href === "/open-slots" && counts.claimed > 0 ? <span style={emberBadgeMuted}>{counts.claimed}</span> : null}
              {item.href === "/customers" && standbyPending.count > 0 ? <span style={emberBadge}>{standbyPending.count}</span> : null}
            </div>
          ))}

          <p className="pf-kicker pf-sidebar-nav__kicker pf-sidebar-nav__kicker--workspace">Workspace</p>
          {workspaceNav.map((item) => (
            <div key={item.href} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <AppNavItem href={item.href} label={item.label} icon={item.icon} />
              </div>
            </div>
          ))}
        </nav>
      </LayoutGroup>

      <div className="pf-sidebar-footer">
        <div className="pf-sidebar-footer__card">
          <p className="pf-sidebar-footer__eyebrow">Account</p>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 650, color: "var(--pf-text-primary)", lineHeight: 1.25 }}>
            {profile.full_name?.trim() || "Operator"}
          </p>
          <p className="pf-muted-copy" style={{ margin: "6px 0 0", fontSize: 12 }}>
            {truncateEmail(profile.email ?? "", 36)}
          </p>
          <div style={{ marginTop: 12, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--pf-accent-primary-hover)",
              }}
            >
              {profile.role}
            </span>
            <span
              style={{
                borderRadius: 999,
                padding: "4px 10px",
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                border: live ? "1px solid var(--pf-accent-primary-border)" : "1px solid var(--pf-brand-border-warm)",
                background: live ? "var(--pf-accent-primary-soft)" : "var(--pf-surface-tint-05)",
                color: live ? "var(--pf-accent-primary-hover)" : "var(--pf-text-muted)",
              }}
            >
              {live ? "Live" : "Setup"}
            </span>
          </div>
        </div>
        {!live ? (
          <Link href="/overview#getting-started" className="pf-sidebar-next-step">
            Continue setup →
          </Link>
        ) : (
          <Link
            href="/open-slots/create"
            style={{
              display: "block",
              marginTop: 12,
              marginLeft: 4,
              fontSize: 12,
              fontWeight: 600,
              color: "var(--pf-accent-primary)",
            }}
          >
            + Create opening
          </Link>
        )}
      </div>
    </aside>
  );
}
