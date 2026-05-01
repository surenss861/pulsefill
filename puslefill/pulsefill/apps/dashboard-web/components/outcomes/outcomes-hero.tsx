import Link from "next/link";
import { PageCommandHeader } from "@/components/operator/page-command-header";
import { actionLinkStyle } from "@/lib/operator-action-link-styles";

type OutcomesHeroProps = {
  windowLabel?: string;
};

export function OutcomesHero({ windowLabel }: OutcomesHeroProps) {
  const badgeText = windowLabel?.trim() || "Last 24 hours";
  const meta = (
    <span
      style={{
        borderRadius: 999,
        border: "1px solid rgba(255,255,255,0.1)",
        background: "rgba(255,255,255,0.04)",
        padding: "6px 12px",
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: "0.16em",
        textTransform: "uppercase",
        color: "rgba(245, 247, 250, 0.48)",
      }}
    >
      {badgeText}
    </span>
  );

  return (
    <PageCommandHeader
      animate={false}
      tone="default"
      eyebrow="Recovery archive"
      title="Outcomes"
      description="Recovered, missed, and expired openings in this window — use it as an operating log tied to measurable recovery."
      meta={meta}
      primaryAction={
        <Link href="/action-queue?section=needs_action" style={actionLinkStyle("primary")}>
          Open queue
        </Link>
      }
      style={{ marginBottom: 4 }}
    />
  );
}
