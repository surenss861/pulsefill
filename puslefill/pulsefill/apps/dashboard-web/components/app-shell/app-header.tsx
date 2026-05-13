import type { ProfileRow } from "@/lib/get-current-user";
import { AppUserBadge } from "./app-user-badge";

type AppHeaderProps = {
  user: { id: string; email: string };
  profile: ProfileRow;
};

export function AppHeader({ user, profile }: AppHeaderProps) {
  const live = profile.onboarding_completed;

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
        style={{
          display: "flex",
          height: 64,
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          padding: "0 16px 0 24px",
        }}
      >
        <div style={{ minWidth: 0 }}>
          <p className="pf-kicker" style={{ margin: 0, fontSize: 11, letterSpacing: "0.12em", textTransform: "none", color: "rgba(201, 191, 179, 0.78)" }}>
            PulseFill desk
          </p>
          <p
            className="pf-muted-copy"
            style={{ margin: "4px 0 0", fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
          >
            Openings, waiting customers, and confirmations in one place
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
          <span
            style={{
              display: "none",
              borderRadius: 999,
              padding: "6px 12px",
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              border: live ? "1px solid var(--pf-accent-primary-border)" : "1px solid var(--pf-brand-border-warm)",
              background: live ? "var(--pf-accent-primary-soft)" : "var(--pf-surface-tint-04)",
              color: live ? "var(--pf-accent-primary-hover)" : "var(--pf-text-muted)",
            }}
            className="pf-app-workspace-pill"
          >
            {live ? "Workspace live" : "Setup pending"}
          </span>
          <AppUserBadge name={profile.full_name} email={user.email || profile.email} role={profile.role} />
        </div>
      </div>
      <style>{`
        @media (min-width: 640px) {
          .pf-app-workspace-pill { display: inline-flex !important; align-items: center; }
        }
      `}</style>
    </header>
  );
}
