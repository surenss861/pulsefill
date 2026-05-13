import type { ReactNode } from "react";

type DeskSecondaryCardProps = {
  title: string;
  /** Optional right-aligned control in the card header row. */
  headerAction?: ReactNode;
  children: ReactNode;
};

function slugId(title: string): string {
  return `pf-desk-sec-${title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")}`;
}

/** Quieter supporting blocks — account, profile, checklist, security. */
export function DeskSecondaryCard({ title, headerAction, children }: DeskSecondaryCardProps) {
  const id = slugId(title);
  return (
    <section className="pf-desk-secondary-card" aria-labelledby={id}>
      <div className="pf-desk-secondary-card__head">
        <h2 id={id} className="pf-desk-secondary-card__title">
          {title}
        </h2>
        {headerAction ? <div className="pf-desk-secondary-card__action">{headerAction}</div> : null}
      </div>
      <div className="pf-desk-secondary-card__body">{children}</div>
    </section>
  );
}
