"use client";

import type { CSSProperties } from "react";
import Link from "next/link";
import type { ProfileRow } from "@/lib/get-current-user";
import { useLiveCounts } from "@/hooks/useLiveCounts";
import { useNeedsAttentionCount } from "@/hooks/useNeedsAttentionCount";
import { AppNavItem } from "./app-nav-item";

type AppSidebarProps = {
  profile: ProfileRow;
};

const primaryNav = [
  { href: "/overview", label: "Overview" },
  { href: "/action-queue", label: "Recovery Queue" },
  { href: "/open-slots", label: "Open Slots" },
  { href: "/outcomes", label: "Outcomes" },
  { href: "/activity", label: "Activity" },
] as const;

const secondaryLinks = [
  { href: "/offers", label: "Offers" },
  { href: "/claims", label: "Claims" },
  { href: "/customers", label: "Customers" },
  { href: "/providers", label: "Providers" },
  { href: "/services", label: "Services" },
  { href: "/locations", label: "Locations" },
  { href: "/analytics", label: "Analytics" },
  { href: "/billing", label: "Billing" },
  { href: "/settings", label: "Account & settings" },
] as const;

const badgeBase: CSSProperties = {
  marginLeft: "auto",
  borderRadius: 999,
  padding: "2px 8px",
  fontSize: 11,
  fontWeight: 600,
  border: "1px solid",
};

export function AppSidebar({ profile }: AppSidebarProps) {
  const counts = useLiveCounts();
  const needsAttention = useNeedsAttentionCount();
  const live = profile.onboarding_completed;

  return (
    <aside
      className="pf-app-sidebar"
      style={{
        width: 280,
        flexShrink: 0,
        borderRight: "1px solid var(--pf-border-subtle)",
        background: "#08090c",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ borderBottom: "1px solid var(--pf-border-subtle)", padding: "24px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: 999,
              background: "var(--pf-accent-primary)",
              boxShadow: "0 0 20px rgba(255, 122, 24, 0.55)",
            }}
          />
          <div>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 650, letterSpacing: "0.16em", color: "rgba(245, 247, 250, 0.9)" }}>PulseFill</p>
            <p style={{ margin: "4px 0 0", fontSize: 11, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(245, 247, 250, 0.38)" }}>
              Recovery system
            </p>
          </div>
        </div>
      </div>

      <nav style={{ flex: 1, padding: "16px 12px", display: "flex", flexDirection: "column", gap: 6, overflowY: "auto" }}>
        <p style={{ margin: "0 8px 8px", fontSize: 10, fontWeight: 700, letterSpacing: "0.2em", color: "rgba(245, 247, 250, 0.32)", textTransform: "uppercase" }}>
          Navigate
        </p>
        {primaryNav.map((item) => (
          <div key={item.href} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <AppNavItem href={item.href} label={item.label} />
            </div>
            {item.href === "/action-queue" && needsAttention > 0 ? (
              <span
                style={{
                  ...badgeBase,
                  flexShrink: 0,
                  background: "rgba(245, 158, 11, 0.12)",
                  borderColor: "rgba(251, 191, 36, 0.25)",
                  color: "#fcd34d",
                }}
              >
                {needsAttention}
              </span>
            ) : null}
            {item.href === "/open-slots" && counts.open > 0 ? (
              <span
                style={{
                  ...badgeBase,
                  flexShrink: 0,
                  background: "rgba(14, 165, 233, 0.1)",
                  borderColor: "rgba(56, 189, 248, 0.22)",
                  color: "#7dd3fc",
                }}
              >
                {counts.open}
              </span>
            ) : null}
          </div>
        ))}

        <p style={{ margin: "20px 8px 8px", fontSize: 10, fontWeight: 700, letterSpacing: "0.2em", color: "rgba(245, 247, 250, 0.32)", textTransform: "uppercase" }}>
          Workspace
        </p>
        <div style={{ display: "grid", gap: 4 }}>
          {secondaryLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              style={{
                fontSize: 13,
                padding: "8px 12px",
                borderRadius: 12,
                color: "rgba(245, 247, 250, 0.55)",
                textDecoration: "none",
              }}
            >
              <span style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                {l.label}
                {l.href === "/claims" && counts.claimed > 0 ? (
                  <span
                    style={{
                      ...badgeBase,
                      marginLeft: 0,
                      background: "rgba(245, 158, 11, 0.1)",
                      borderColor: "rgba(251, 191, 36, 0.22)",
                      color: "#fcd34d",
                    }}
                  >
                    {counts.claimed}
                  </span>
                ) : null}
              </span>
            </Link>
          ))}
        </div>
      </nav>

      <div style={{ borderTop: "1px solid var(--pf-border-subtle)", padding: 16 }}>
        <div
          style={{
            borderRadius: 18,
            border: "1px solid var(--pf-border-subtle)",
            background: "#0a0f1a",
            padding: 16,
          }}
        >
          <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "rgba(245, 247, 250, 0.9)" }}>
            {profile.full_name?.trim() || "PulseFill operator"}
          </p>
          <p style={{ margin: "6px 0 0", fontSize: 13, color: "rgba(245, 247, 250, 0.45)" }}>{profile.email}</p>
          <div style={{ marginTop: 12, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase", color: "#ffb070" }}>
              {profile.role}
            </span>
            <span
              style={{
                borderRadius: 999,
                padding: "4px 10px",
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                border: live ? "1px solid var(--pf-accent-primary-border)" : "1px solid rgba(255,255,255,0.1)",
                background: live ? "rgba(255, 122, 24, 0.08)" : "rgba(255,255,255,0.03)",
                color: live ? "#ffb070" : "rgba(245, 247, 250, 0.52)",
              }}
            >
              {live ? "Live" : "Setup"}
            </span>
          </div>
        </div>
        {!live ? (
          <p style={{ margin: "12px 0 0", fontSize: 12, lineHeight: 1.45, color: "rgba(245, 247, 250, 0.42)" }}>
            Finish setup so every operator surface stays fully enabled.
          </p>
        ) : null}
        <Link href="/open-slots/create" style={{ display: "block", marginTop: 12, fontSize: 12, fontWeight: 600, color: "var(--pf-accent-primary)" }}>
          + Create open slot
        </Link>
      </div>
    </aside>
  );
}
