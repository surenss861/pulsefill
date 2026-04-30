import type { CSSProperties, ReactNode } from "react";

export type PageIntroTone = "default" | "quiet" | "elevated";

const toneShell: Record<PageIntroTone, CSSProperties> = {
  default: {
    border: "1px solid var(--pf-border-subtle)",
    background:
      "linear-gradient(180deg, rgba(255,255,255,0.038), rgba(255,122,24,0.018)), var(--pf-bg-surface)",
    boxShadow: "0 24px 70px rgba(0,0,0,0.35)",
  },
  quiet: {
    border: "1px solid var(--pf-border-subtle)",
    background: "var(--pf-bg-surface-muted)",
    boxShadow: "none",
  },
  elevated: {
    border: "1px solid var(--pf-card-hero-border)",
    background: "var(--pf-card-hero-bg)",
    boxShadow: "0 28px 76px rgba(0,0,0,0.36), inset 0 1px 0 rgba(255,255,255,0.05), 0 0 0 1px rgba(255, 122, 24, 0.06)",
  },
};

type PageIntroCardProps = {
  overline: string;
  title: ReactNode;
  description?: ReactNode;
  /** Right or bottom action cluster (links, buttons, refresh). */
  actions?: ReactNode;
  /** Optional badge / pill beside actions (e.g. “Last 24 hours”). */
  badge?: ReactNode;
  tone?: PageIntroTone;
  /** `split` places actions alongside the text block (command surfaces like Overview). */
  layout?: "stack" | "split";
  /** Max width of the text column. */
  introMaxWidth?: number;
  /** Tighter hero for list pages with less headline copy. */
  density?: "default" | "compact";
  style?: CSSProperties;
};

/**
 * Shared page intro / hero rhythm: overline → title → support copy → optional badge + actions.
 * Use across Overview, Queue, Open Slots, Outcomes, Activity, Settings.
 */
export function PageIntroCard({
  overline,
  title,
  description,
  actions,
  badge,
  tone = "default",
  layout = "stack",
  introMaxWidth = 720,
  density = "default",
  style,
}: PageIntroCardProps) {
  const compact = density === "compact";
  const textBlock = (
    <div style={{ maxWidth: introMaxWidth, flex: layout === "split" ? "1 1 280px" : undefined, minWidth: 0 }}>
      <p
        style={{
          margin: 0,
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          color: "rgba(245, 247, 250, 0.38)",
        }}
      >
        {overline}
      </p>
      <div
        style={{
          marginTop: compact ? 8 : 12,
          fontSize: compact ? "clamp(1.35rem, 3vw, 2rem)" : "clamp(1.75rem, 4vw, 2.75rem)",
          fontWeight: 650,
          letterSpacing: "-0.04em",
          lineHeight: 1.1,
          color: "var(--pf-text-primary)",
        }}
      >
        {title}
      </div>
      {description ? (
        <div
          style={{
            marginTop: compact ? 10 : 14,
            maxWidth: 560,
            fontSize: compact ? 14 : 15,
            lineHeight: 1.55,
            color: "rgba(245, 247, 250, 0.62)",
          }}
        >
          {description}
        </div>
      ) : null}
    </div>
  );

  const actionCluster =
    badge || actions ? (
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 12,
          justifyContent: layout === "split" ? "flex-end" : "flex-start",
        }}
      >
        {badge}
        {actions}
      </div>
    ) : null;

  return (
    <section
      style={{
        marginBottom: 0,
        borderRadius: 28,
        padding: compact ? "clamp(14px, 2vw, 20px)" : "clamp(20px, 3vw, 28px)",
        ...toneShell[tone],
        ...style,
      }}
    >
      {layout === "split" ? (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 20,
            justifyContent: "space-between",
            alignItems: "flex-end",
          }}
        >
          {textBlock}
          {actionCluster}
        </div>
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 20,
            alignItems: "stretch",
          }}
        >
          {textBlock}
          {actionCluster}
        </div>
      )}
    </section>
  );
}
