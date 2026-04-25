import type { CSSProperties, ReactNode } from "react";

export type SectionCardDensity = "default" | "dense";

type SectionCardProps = {
  eyebrow: string;
  title: ReactNode;
  description?: ReactNode;
  /** Optional header actions (filters, links). */
  headerActions?: ReactNode;
  children: ReactNode;
  density?: SectionCardDensity;
  style?: CSSProperties;
};

/** Section container: eyebrow → title → body copy → children. */
export function SectionCard({ eyebrow, title, description, headerActions, children, density = "default", style }: SectionCardProps) {
  const pad = density === "dense" ? "18px 20px" : "22px 24px";
  return (
    <section
      style={{
        borderRadius: 28,
        border: "1px solid var(--pf-border-subtle)",
        background: "#0a0f1a",
        padding: pad,
        ...style,
      }}
    >
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: description || children ? 18 : 0,
        }}
      >
        <div style={{ minWidth: 0, flex: "1 1 200px" }}>
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
            {eyebrow}
          </p>
          <h2
            style={{
              margin: "10px 0 0",
              fontSize: 22,
              fontWeight: 650,
              letterSpacing: "-0.03em",
              color: "var(--pf-text-primary)",
            }}
          >
            {title}
          </h2>
          {description ? (
            <div style={{ marginTop: 10, maxWidth: 560, fontSize: 13, lineHeight: 1.55, color: "rgba(245, 247, 250, 0.55)" }}>
              {description}
            </div>
          ) : null}
        </div>
        {headerActions ? <div style={{ flexShrink: 0 }}>{headerActions}</div> : null}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>{children}</div>
    </section>
  );
}
