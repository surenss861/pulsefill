import Link from "next/link";
import { SectionCard } from "@/components/ui/section-card";
import { StatusPill } from "@/components/ui/status-pill";
import type { OutcomesLeakRow } from "@/lib/outcomes-page-data";

type OutcomesLeakPanelProps = {
  leaks: OutcomesLeakRow[];
};

export function OutcomesLeakPanel({ leaks }: OutcomesLeakPanelProps) {
  return (
    <SectionCard
      eyebrow={"What's leaking"}
      title="Where recovery is breaking down"
      style={{ minWidth: 0, flex: "1 1 320px" }}
    >
      {leaks.map((leak) => {
        const accent =
          leak.emphasis === "primary"
            ? "1px solid var(--pf-accent-primary-border)"
            : leak.emphasis === "danger"
              ? "1px solid var(--pf-accent-secondary-border)"
              : "1px solid var(--pf-border-subtle)";

        return (
          <div
            key={leak.title}
            style={{
              borderRadius: "var(--pf-radius-md)",
              border: accent,
              background: "rgba(255,255,255,0.02)",
              padding: 16,
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "rgba(245, 247, 250, 0.88)" }}>{leak.title}</p>
                  <StatusPill variant="default" caps>
                    {leak.value}
                  </StatusPill>
                </div>
                <p
                  style={{
                    margin: "10px 0 0",
                    maxWidth: "58ch",
                    fontSize: 13,
                    lineHeight: 1.55,
                    color: "rgba(245, 247, 250, 0.55)",
                  }}
                >
                  {leak.body}
                </p>
              </div>
              <Link
                href={leak.href}
                style={{
                  flexShrink: 0,
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#ffb070",
                  textDecoration: "none",
                  whiteSpace: "nowrap",
                }}
              >
                {leak.cta} →
              </Link>
            </div>
          </div>
        );
      })}
    </SectionCard>
  );
}
