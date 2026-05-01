import type { CSSProperties, ReactNode } from "react";
import { operatorSurfaceShell } from "@/lib/operator-surface-styles";

export type SectionCardDensity = "default" | "dense";

/** Visual shell: default matches legacy section card; operational / quiet use shared operator surfaces; hairline is a thin control-panel row. */
export type SectionCardSurfaceTone = "default" | "operational" | "quiet" | "hairline";

type SectionCardProps = {
  eyebrow: string;
  title: ReactNode;
  description?: ReactNode;
  /** Optional header actions (filters, links). */
  headerActions?: ReactNode;
  children: ReactNode;
  density?: SectionCardDensity;
  surfaceTone?: SectionCardSurfaceTone;
  style?: CSSProperties;
};

const defaultShell: CSSProperties = {
  borderRadius: 28,
  border: "1px solid var(--pf-border-subtle)",
  background:
    "linear-gradient(180deg, rgba(255,255,255,0.035), rgba(255,122,24,0.012)), var(--pf-bg-surface)",
  boxShadow: "0 18px 54px rgba(0,0,0,0.24), inset 0 1px 0 rgba(255,255,255,0.035)",
};

function sectionShell(tone: SectionCardSurfaceTone): CSSProperties {
  if (tone === "operational") return { ...operatorSurfaceShell("operational"), borderRadius: 28 };
  if (tone === "quiet") return { ...operatorSurfaceShell("quiet"), borderRadius: 28 };
  if (tone === "hairline") {
    return {
      borderRadius: 16,
      border: "1px solid var(--pf-border-subtle)",
      background: "rgba(255,255,255,0.02)",
      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)",
    };
  }
  return defaultShell;
}

/** Section container: eyebrow → title → body copy → children. */
export function SectionCard({
  eyebrow,
  title,
  description,
  headerActions,
  children,
  density = "default",
  surfaceTone = "default",
  style,
}: SectionCardProps) {
  const pad = density === "dense" ? "16px 18px" : "22px 24px";
  return (
    <section
      style={{
        ...sectionShell(surfaceTone),
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
          marginBottom: description || children ? (surfaceTone === "hairline" ? 12 : 18) : 0,
        }}
      >
        <div style={{ minWidth: 0, flex: "1 1 200px" }}>
          <p className="pf-kicker" style={{ fontSize: 11 }}>
            {eyebrow}
          </p>
          <h2 className="pf-section-title" style={{ margin: "10px 0 0", fontSize: 22, letterSpacing: "-0.03em" }}>
            {title}
          </h2>
          {description ? (
            <div className="pf-muted-copy" style={{ marginTop: 10, maxWidth: 560 }}>
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
