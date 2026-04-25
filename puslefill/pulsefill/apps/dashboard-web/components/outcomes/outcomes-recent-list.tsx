import Link from "next/link";
import { RecordRowCard } from "@/components/ui/record-row-card";
import { SectionCard } from "@/components/ui/section-card";
import { StatusPill } from "@/components/ui/status-pill";
import type { OutcomesRecentItem } from "@/lib/outcomes-page-data";

type OutcomesRecentListProps = {
  title: string;
  body: string;
  items: OutcomesRecentItem[];
  emphasis: "primary" | "danger";
};

export function OutcomesRecentList({ title, body, items, emphasis }: OutcomesRecentListProps) {
  const pillVariant = emphasis === "primary" ? "primary" : "danger";

  return (
    <SectionCard eyebrow="Recent outcomes" title={title} description={body} style={{ minWidth: 0, flex: "1 1 320px" }}>
      {items.length === 0 ? (
        <p
          style={{
            margin: 0,
            fontSize: 14,
            lineHeight: 1.55,
            color: "rgba(245, 247, 250, 0.5)",
          }}
        >
          Nothing in this window yet.
        </p>
      ) : null}
      {items.map((item) => (
        <RecordRowCard
          key={item.id}
          topMeta={<StatusPill variant={pillVariant} caps>{item.outcome}</StatusPill>}
          title={item.title}
          detail={item.detail}
          actions={
            <Link
              href={item.href}
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "#ffb070",
                textDecoration: "none",
                whiteSpace: "nowrap",
                padding: "8px 12px",
                borderRadius: "var(--pf-radius-sm)",
                border: "1px solid var(--pf-border-subtle)",
                background: "rgba(255,255,255,0.03)",
              }}
            >
              Open detail →
            </Link>
          }
        />
      ))}
    </SectionCard>
  );
}
