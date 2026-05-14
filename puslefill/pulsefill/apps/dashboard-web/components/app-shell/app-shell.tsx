import Link from "next/link";
import type { ProfileRow } from "@/lib/get-current-user";
import { AppHeader } from "./app-header";
import { AppSidebar } from "./app-sidebar";
import { WorkspaceRouteMorph } from "./workspace-route-morph";

export type AppShellUser = { id: string; email: string };

type AppShellProps = {
  children: React.ReactNode;
  user: AppShellUser;
  profile: ProfileRow;
};

export function AppShell({ children, user, profile }: AppShellProps) {
  return (
    <div
      className="pf-app-root"
      style={{
        minHeight: "100vh",
        background: "var(--pf-bg-app)",
        color: "var(--pf-text-primary)",
        fontFamily: "var(--pf-font-sans)",
      }}
    >
      <div className="pf-app-shell-row" style={{ display: "flex", minHeight: "100vh" }}>
        <AppSidebar profile={profile} />
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
          <AppHeader user={user} profile={profile} />
          <div className="pf-app-mobile-quick" style={{ display: "none", borderBottom: "1px solid var(--pf-border-subtle)", padding: "10px 12px", gap: 8, overflowX: "auto" }}>
            <MobileQuick href="/overview" label="Today" />
            <MobileQuick href="/open-slots" label="Appointment files" />
            <MobileQuick href="/customers" label="Waitlist" />
            <MobileQuick href="/activity" label="Log" />
            <MobileQuick href="/settings" label="Workspace" />
            <MobileQuick href="/billing" label="Billing file" />
          </div>
          <div className="pf-workspace-field">
            <div className="pf-workspace-inner pf-workspace-desk-sheet">
              <WorkspaceRouteMorph>{children}</WorkspaceRouteMorph>
            </div>
          </div>
        </div>
      </div>
      <style>{`
        @media (prefers-reduced-motion: reduce) {
          .pf-workspace-inner { scroll-behavior: auto; }
        }
        @media (max-width: 1023px) {
          .pf-app-sidebar { display: none !important; }
          .pf-app-mobile-quick { display: flex !important; }
          .pf-app-shell-row { flex-direction: column; }
        }
      `}</style>
    </div>
  );
}

function MobileQuick({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      style={{
        flexShrink: 0,
        fontSize: 12,
        fontWeight: 600,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        color: "var(--pf-text-secondary)",
        textDecoration: "none",
        padding: "6px 10px",
        borderRadius: 10,
        border: "1px solid var(--pf-brand-border-warm)",
        background: "var(--pf-surface-tint-04)",
      }}
    >
      {label}
    </Link>
  );
}
