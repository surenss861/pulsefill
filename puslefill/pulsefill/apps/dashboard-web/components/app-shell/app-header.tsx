"use client";

import { usePathname } from "next/navigation";
import type { ProfileRow } from "@/lib/get-current-user";
import { deskContextForPath } from "@/lib/desk-shell-context";
import { AppUserBadge } from "./app-user-badge";

type AppHeaderProps = {
  user: { id: string; email: string };
  profile: ProfileRow;
};

export function AppHeader({ user, profile }: AppHeaderProps) {
  const pathname = usePathname() ?? "";
  const live = profile.onboarding_completed;
  const { kicker, subtitle } = deskContextForPath(pathname);

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 20,
        borderBottom: "1px solid var(--pf-border-subtle)",
        background: "color-mix(in srgb, var(--pf-bg-elevated) 88%, transparent)",
        backdropFilter: "blur(18px)",
      }}
    >
      <div
        className="pf-app-header-row"
        style={{
          display: "flex",
          minHeight: 56,
          alignItems: "center",
          justifyContent: "space-between",
          gap: 14,
          padding: "0 14px 0 22px",
        }}
      >
        <div style={{ minWidth: 0 }}>
          <p
            className="pf-app-header-kicker"
            style={{
              margin: 0,
              fontSize: 12,
              fontWeight: 650,
              letterSpacing: "0.06em",
              textTransform: "none",
              color: "var(--pf-text-secondary)",
            }}
          >
            {kicker}
          </p>
          <p
            className="pf-muted-copy pf-app-header-subtitle"
            style={{ margin: "3px 0 0", fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
          >
            {subtitle}
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <span
            style={{
              display: "none",
              borderRadius: 999,
              padding: "5px 11px",
              fontSize: 10,
              fontWeight: 650,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              border: live ? "1px solid var(--pf-accent-primary-border)" : "1px solid var(--pf-brand-border-warm)",
              background: live ? "var(--pf-accent-primary-soft)" : "var(--pf-surface-tint-04)",
              color: live ? "var(--pf-accent-primary-hover)" : "var(--pf-text-muted)",
            }}
            className="pf-app-workspace-pill"
          >
            {live ? "Live" : "Setup pending"}
          </span>
          <AppUserBadge name={profile.full_name} email={user.email || profile.email} role={profile.role} />
        </div>
      </div>
      <style>{`
        @media (min-width: 640px) {
          .pf-app-workspace-pill { display: inline-flex !important; align-items: center; }
        }
        @media (max-width: 520px) {
          .pf-app-header-subtitle { white-space: normal !important; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
        }
      `}</style>
    </header>
  );
}
