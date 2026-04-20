"use client";

import { useRouter } from "next/navigation";
import { signOutStaff } from "@/lib/auth";
import { useLiveCounts } from "@/hooks/useLiveCounts";
import { useNeedsAttentionCount } from "@/hooks/useNeedsAttentionCount";

const links: Array<{
  href: string;
  label: string;
  sub?: { href: string; label: string };
}> = [
  { href: "/overview", label: "Overview" },
  { href: "/action-queue", label: "Action queue" },
  { href: "/activity", label: "Activity" },
  { href: "/open-slots", label: "Open slots", sub: { href: "/open-slots/create", label: "Create slot" } },
  { href: "/offers", label: "Offers" },
  { href: "/claims", label: "Claims" },
  { href: "/customers", label: "Customers" },
  { href: "/providers", label: "Providers" },
  { href: "/services", label: "Services" },
  { href: "/locations", label: "Locations" },
  { href: "/analytics", label: "Analytics" },
  { href: "/billing", label: "Billing" },
  { href: "/settings", label: "Settings" },
];

const badgeBase = {
  marginLeft: "auto",
  borderRadius: 999,
  padding: "2px 8px",
  fontSize: 11,
  fontWeight: 600,
  border: "1px solid",
} as const;

export function Sidebar() {
  const router = useRouter();
  const counts = useLiveCounts();
  const needsAttention = useNeedsAttentionCount();

  async function handleLogout() {
    try {
      await signOutStaff();
    } catch {
      // still navigate away
    }
    router.replace("/login");
  }

  return (
    <aside
      style={{
        width: 240,
        borderRight: "1px solid rgba(255,255,255,0.08)",
        padding: 16,
        background: "var(--surface)",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ fontWeight: 700, marginBottom: 16, letterSpacing: 0.2 }}>PulseFill</div>
      <nav style={{ display: "grid", gap: 8, flex: 1 }}>
        {links.map((l) => (
          <div key={l.href} style={{ display: "grid", gap: 4 }}>
            <a
              href={l.href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 14,
              }}
            >
              <span>{l.label}</span>
              {l.href === "/action-queue" && needsAttention > 0 ? (
                <span
                  style={{
                    ...badgeBase,
                    background: "rgba(245, 158, 11, 0.12)",
                    borderColor: "rgba(251, 191, 36, 0.25)",
                    color: "#fcd34d",
                  }}
                >
                  {needsAttention}
                </span>
              ) : null}
              {l.href === "/claims" && counts.claimed > 0 ? (
                <span
                  style={{
                    ...badgeBase,
                    background: "rgba(245, 158, 11, 0.1)",
                    borderColor: "rgba(251, 191, 36, 0.22)",
                    color: "#fcd34d",
                  }}
                >
                  {counts.claimed}
                </span>
              ) : null}
              {l.href === "/open-slots" && counts.open > 0 ? (
                <span
                  style={{
                    ...badgeBase,
                    background: "rgba(14, 165, 233, 0.1)",
                    borderColor: "rgba(56, 189, 248, 0.22)",
                    color: "#7dd3fc",
                  }}
                >
                  {counts.open}
                </span>
              ) : null}
            </a>
            {l.sub ? (
              <a
                href={l.sub.href}
                style={{
                  fontSize: 12,
                  paddingLeft: 4,
                  color: "var(--muted)",
                  textDecoration: "none",
                }}
              >
                {l.sub.label}
              </a>
            ) : null}
          </div>
        ))}
      </nav>
      <button
        type="button"
        onClick={() => void handleLogout()}
        style={{
          marginTop: 16,
          padding: "10px 12px",
          borderRadius: 12,
          border: "1px solid rgba(255,255,255,0.12)",
          background: "rgba(255,255,255,0.05)",
          color: "var(--muted)",
          cursor: "pointer",
          fontSize: 13,
        }}
      >
        Log out
      </button>
    </aside>
  );
}
