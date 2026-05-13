import type { ReactNode } from "react";

type DeskPageHeaderProps = {
  title: string;
  /** One line under the title (sentence case) or richer copy when needed. */
  subtitle?: ReactNode;
  /** Optional right column (actions). */
  actions?: ReactNode;
};

/**
 * Page-level title for Operations Desk — sentence case, no all-caps eyebrow stack.
 */
export function DeskPageHeader({ title, subtitle, actions }: DeskPageHeaderProps) {
  return (
    <header className="pf-desk-page-header">
      <div className="pf-desk-page-header__copy">
        <h1 className="pf-desk-page-header__title">{title}</h1>
        {subtitle ? <div className="pf-desk-page-header__subtitle">{subtitle}</div> : null}
      </div>
      {actions ? <div className="pf-desk-page-header__actions">{actions}</div> : null}
    </header>
  );
}
