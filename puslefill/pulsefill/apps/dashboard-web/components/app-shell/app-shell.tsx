import Link from "next/link";
import type { ProfileRow } from "@/lib/get-current-user";
import { AppHeader } from "./app-header";
import { AppSidebar } from "./app-sidebar";

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
            <MobileQuick href="/overview" label="Command Center" />
            <MobileQuick href="/open-slots" label="Openings" />
            <MobileQuick href="/customers" label="Customers" />
            <MobileQuick href="/activity" label="Activity" />
            <MobileQuick href="/settings" label="Settings" />
          </div>
          <div className="pf-workspace-field">
            <div className="pf-workspace-inner" style={{ animation: "pf-page-enter 180ms ease-out" }}>
              {children}
            </div>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes pf-page-enter {
          from { opacity: 0; transform: translateY(3px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .pf-app-shell-row * { animation: none !important; transition: none !important; }
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
        color: "rgba(245, 247, 250, 0.65)",
        textDecoration: "none",
        padding: "6px 10px",
        borderRadius: 10,
        border: "1px solid rgba(255,255,255,0.1)",
        background: "rgba(255,255,255,0.03)",
      }}
    >
      {label}
    </Link>
  );
}
