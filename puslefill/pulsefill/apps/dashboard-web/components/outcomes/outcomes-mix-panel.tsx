import { SectionCard } from "@/components/ui/section-card";
import { StatusPill } from "@/components/ui/status-pill";
import type { OutcomeMixRow } from "@/lib/outcomes-page-data";

type OutcomesMixPanelProps = {
  outcomeMix: OutcomeMixRow[];
};

function pillVariant(e: OutcomeMixRow["emphasis"]): "primary" | "danger" | "default" {
  if (e === "primary") return "primary";
  if (e === "danger") return "danger";
  return "default";
}

export function OutcomesMixPanel({ outcomeMix }: OutcomesMixPanelProps) {
  return (
    <SectionCard
      eyebrow="Outcome mix"
      title="Where recoveries are landing"
      style={{ minWidth: 0, flex: "1 1 320px" }}
    >
      {outcomeMix.map((item) => (
        <div
          key={item.label}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            borderRadius: "var(--pf-radius-md)",
            border: "1px solid var(--pf-border-subtle)",
            background: "rgba(255,255,255,0.02)",
            padding: "14px 16px",
          }}
        >
          <p style={{ margin: 0, fontSize: 14, color: "rgba(245, 247, 250, 0.82)" }}>{item.label}</p>
          <StatusPill variant={pillVariant(item.emphasis)}>{item.value}</StatusPill>
        </div>
      ))}
    </SectionCard>
  );
}
