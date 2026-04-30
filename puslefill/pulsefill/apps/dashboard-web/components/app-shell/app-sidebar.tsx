"use client";

import type { CSSProperties } from "react";
import Link from "next/link";
import type { ProfileRow } from "@/lib/get-current-user";
import { useLiveCounts } from "@/hooks/useLiveCounts";
import { usePendingStandbyRequests } from "@/hooks/usePendingStandbyRequests";
import { AppNavItem } from "./app-nav-item";
import {
  NavIconActivity,
  NavIconCommandCenter,
  NavIconCustomers,
  NavIconOpenings,
  NavIconSettings,
} from "./nav-dock-icons";

type AppSidebarProps = {
  profile: ProfileRow;
};

const primaryNav = [
  { href: "/overview", label: "Command Center", icon: <NavIconCommandCenter /> },
  { href: "/open-slots", label: "Openings", icon: <NavIconOpenings /> },
  { href: "/customers", label: "Customers", icon: <NavIconCustomers /> },
  { href: "/activity", label: "Activity", icon: <NavIconActivity /> },
  { href: "/settings", label: "Settings", icon: <NavIconSettings /> },
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
      <div className="pf-sidebar-brand">
        <div className="pf-sidebar-brand__mark" aria-hidden />
        <div style={{ minWidth: 0 }}>
          <p className="pf-sidebar-brand__name">PulseFill</p>
          <p className="pf-kicker pf-sidebar-brand__tag">Operator OS</p>
        </div>
      </div>

      <div className="pf-sidebar-workspace">
        <p className="pf-kicker pf-sidebar-workspace__line">Recovery workspace</p>
        <p className="pf-sidebar-workspace__email">{truncateEmail(profile.email ?? "")}</p>
      </div>

      <nav className="pf-sidebar-nav">
        <p className="pf-kicker pf-sidebar-nav__kicker">Primary</p>
        {primaryNav.map((item) => (
          <div key={item.href} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <AppNavItem href={item.href} label={item.label} icon={item.icon} />
            </div>
            {item.href === "/open-slots" && counts.open > 0 ? (
              <span style={emberBadge}>{counts.open}</span>
            ) : null}
            {item.href === "/open-slots" && counts.claimed > 0 ? (
              <span style={emberBadgeMuted}>{counts.claimed}</span>
            ) : null}
            {item.href === "/customers" && standbyPending.count > 0 ? (
              <span style={emberBadge}>{standbyPending.count}</span>
            ) : null}
          </div>
        ))}
      </nav>

      <div className="pf-sidebar-footer">
        <div className="pf-sidebar-footer__card">
          <p className="pf-meta-row" style={{ margin: "0 0 6px", letterSpacing: "0.14em", textTransform: "uppercase" }}>
            Signed in
          </p>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 650, color: "rgba(245, 247, 250, 0.92)", lineHeight: 1.25 }}>
            {profile.full_name?.trim() || "Operator"}
          </p>
          <p className="pf-muted-copy" style={{ margin: "6px 0 0", fontSize: 12 }}>
            {truncateEmail(profile.email ?? "", 36)}
          </p>
          <div style={{ marginTop: 12, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255, 176, 112, 0.88)" }}>
              {profile.role}
            </span>
            <span
              style={{
                borderRadius: 999,
                padding: "4px 10px",
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                border: live ? "1px solid rgba(255, 122, 24, 0.26)" : "1px solid rgba(255,255,255,0.1)",
                background: live ? "rgba(255, 122, 24, 0.08)" : "rgba(255,255,255,0.04)",
                color: live ? "rgba(255, 200, 160, 0.92)" : "rgba(245, 247, 250, 0.48)",
              }}
            >
              {live ? "Live" : "Setup"}
            </span>
          </div>
        </div>
        {!live ? (
          <>
            <p className="pf-meta-row" style={{ margin: "14px 4px 0", textTransform: "uppercase", letterSpacing: "0.16em" }}>
              Next action
            </p>
            <Link
              href="/overview#getting-started"
              style={{ display: "block", marginTop: 8, marginLeft: 4, fontSize: 12, fontWeight: 600, color: "var(--pf-accent-primary)" }}
            >
              Continue setup →
            </Link>
          </>
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
