import Link from "next/link";
import { PageIntroCard } from "@/components/ui/page-intro-card";
import { actionLinkStyle } from "@/components/ui/action-button";

type OverviewOperatorHeroProps = {
  displayName: string | null;
  email: string;
  role: string;
  onboardingCompleted: boolean;
};

function roleLabel(role: string) {
  if (!role) return "Operator";
  return role.charAt(0).toUpperCase() + role.slice(1);
}

export function OverviewOperatorHero({
  displayName,
  email,
  role,
  onboardingCompleted,
}: OverviewOperatorHeroProps) {
  const greeting = displayName?.trim() || email.split("@")[0] || "Operator";

  const badge = (
    <span
      style={{
        borderRadius: 999,
        padding: "8px 14px",
        fontSize: 11,
        fontWeight: 650,
        letterSpacing: "0.16em",
        textTransform: "uppercase",
        border: onboardingCompleted ? "1px solid rgba(255, 122, 24, 0.22)" : "1px solid rgba(255,255,255,0.1)",
        background: onboardingCompleted ? "rgba(255, 122, 24, 0.06)" : "rgba(255,255,255,0.03)",
        color: onboardingCompleted ? "rgba(255, 186, 120, 0.92)" : "rgba(245, 247, 250, 0.52)",
      }}
    >
      {onboardingCompleted ? "Workspace live" : "Setup pending"}
    </span>
  );

  const actions = (
    <>
      <Link href="/action-queue?section=needs_action" style={actionLinkStyle("primary")}>
        Open queue
      </Link>
      <Link href="/open-slots" style={actionLinkStyle("secondary")}>
        Browse slots
      </Link>
    </>
  );

  return (
    <PageIntroCard
      style={{ marginBottom: 28 }}
      tone="elevated"
      layout="split"
      overline="Recovery overview"
      title={<>Welcome back, {greeting}.</>}
      description={
        <>
          Signed in as {email}. Use Queue for urgent recovery work, Slots for inventory, and this overview for daily
          signals.
          <span style={{ display: "block", marginTop: 10, fontSize: 12, color: "rgba(245, 247, 250, 0.42)" }}>
            Role: <span style={{ color: "#ffb070", fontWeight: 600 }}>{roleLabel(role)}</span>
          </span>
        </>
      }
      badge={badge}
      actions={actions}
    />
  );
}
