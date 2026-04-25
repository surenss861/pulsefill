import type { ReactNode } from "react";
import { PageIntroCard } from "@/components/ui/page-intro-card";

type ActivityHeroProps = {
  actions?: ReactNode;
};

export function ActivityHero({ actions }: ActivityHeroProps) {
  const badge = (
    <span
      style={{
        borderRadius: 999,
        border: "1px solid var(--pf-accent-primary-border)",
        background: "rgba(255, 122, 24, 0.08)",
        padding: "8px 14px",
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: "0.18em",
        textTransform: "uppercase",
        color: "#ffb070",
      }}
    >
      Recent history
    </span>
  );

  return (
    <PageIntroCard
      overline="Activity"
      title="Operational record."
      description="Track what changed across recovery, what failed, what resolved, and where the system still needs attention."
      badge={badge}
      actions={actions}
    />
  );
}
