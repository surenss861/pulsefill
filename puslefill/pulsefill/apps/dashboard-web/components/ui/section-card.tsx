import type { CSSProperties, ReactNode } from "react";
import { operatorSurfaceShell } from "@/lib/operator-surface-styles";

export type SectionCardDensity = "default" | "dense";

/** Visual shell: default matches legacy section card; operational / quiet use shared operator surfaces. */
export type SectionCardSurfaceTone = "default" | "operational" | "quiet";

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
