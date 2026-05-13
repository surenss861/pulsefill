import type { ReactNode } from "react";

type DeskHeroCardProps = {
  title: string;
  /** Stable id for `aria-labelledby` (unique per page when multiple heroes exist). */
  titleId?: string;
  /** Short label above the title (sentence case), e.g. mode name. */
  eyebrow?: string;
  children: ReactNode;
};

/** Primary workspace action surface — one per page when something must dominate. */
export function DeskHeroCard({ title, titleId = "pf-desk-hero-card-title", eyebrow, children }: DeskHeroCardProps) {
  return (
    <section className="pf-desk-hero-card" aria-labelledby={titleId}>
      {eyebrow ? <p className="pf-desk-hero-card__eyebrow">{eyebrow}</p> : null}
      <h2 id={titleId} className="pf-desk-hero-card__title">
        {title}
      </h2>
      <div className="pf-desk-hero-card__body">{children}</div>
    </section>
  );
}
