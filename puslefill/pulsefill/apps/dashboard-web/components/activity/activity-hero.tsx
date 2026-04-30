import type { ReactNode } from "react";
import { PageCommandHeader } from "@/components/operator/page-command-header";

type ActivityHeroProps = {
  actions?: ReactNode;
};

export function ActivityHero({ actions }: ActivityHeroProps) {
  const meta = (
    <span
      style={{
        borderRadius: 999,
        border: "1px solid rgba(255, 122, 24, 0.2)",
        background: "rgba(255, 122, 24, 0.06)",
        padding: "6px 12px",
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: "0.16em",
        textTransform: "uppercase",
        color: "#ffb070",
      }}
    >
      Recent history
    </span>
  );

  return (
    <PageCommandHeader
      animate={false}
      tone="default"
      eyebrow="Activity"
      title="Recovery log"
      description="Track offers, claims, confirmations, and missed opportunities."
      meta={meta}
      secondaryAction={actions}
      style={{ marginBottom: 4 }}
    />
  );
}
