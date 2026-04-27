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
        background: "rgba(5, 5, 5, 0.86)",
        backdropFilter: "blur(16px)",
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
          <p
            style={{
              margin: 0,
              fontSize: 11,
              letterSpacing: "0.24em",
              textTransform: "uppercase",
              color: "rgba(245, 247, 250, 0.34)",
            }}
          >
            Operator workspace
          </p>
          <p style={{ margin: "4px 0 0", fontSize: 14, color: "rgba(245, 247, 250, 0.72)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            Recovery visibility, action, and control
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
              border: live ? "1px solid rgba(255, 122, 24, 0.22)" : "1px solid rgba(255,255,255,0.1)",
              background: live ? "rgba(255, 122, 24, 0.06)" : "rgba(255,255,255,0.03)",
              color: live ? "rgba(255, 186, 120, 0.92)" : "rgba(245, 247, 250, 0.52)",
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
