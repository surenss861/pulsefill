import type { ReactNode } from "react";

type Props = {
  eyebrow: string;
  title: string;
  description?: string;
  children: ReactNode;
  /** For in-page scroll targets (e.g. recovery pipeline step jump). */
  sectionId?: string;
};

export function OpenSlotDetailSection({ eyebrow, title, description, children, sectionId }: Props) {
  return (
    <section
      id={sectionId}
      style={{
        display: "grid",
        gap: 14,
        ...(sectionId ? { scrollMarginTop: 96 } : {}),
      }}
    >
      <div>
        <p style={{ margin: 0, fontSize: 11, fontWeight: 700, letterSpacing: "0.2em", color: "rgba(245,247,250,0.34)", textTransform: "uppercase" }}>
          {eyebrow}
        </p>
        <h2 style={{ margin: "8px 0 0", fontSize: 18, fontWeight: 650, letterSpacing: "-0.02em", color: "var(--pf-text-primary)" }}>{title}</h2>
        {description ? (
          <p style={{ margin: "8px 0 0", fontSize: 13, lineHeight: 1.55, color: "rgba(245,247,250,0.52)", maxWidth: 720 }}>{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}
