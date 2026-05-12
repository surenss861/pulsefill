import type { ReactNode } from "react";

type AuthWarmCardProps = {
  /** When set, replaces eyebrow / title / lede (e.g. animated morph header). */
  header?: ReactNode;
  eyebrow?: string;
  title?: string;
  lede?: string;
  children: ReactNode;
  /** Optional region below children (e.g. links); not auto-wrapped in `pf-auth-footer`. */
  footer?: ReactNode;
  /** Default on: entrance animation on the card shell. */
  animateEnter?: boolean;
};

/** Walnut case-file style card — same surface system as `/sign-in`. */
export function AuthWarmCard({ header, eyebrow, title, lede, children, footer, animateEnter = true }: AuthWarmCardProps) {
  const shellCls = ["pf-auth-card", animateEnter ? "pf-auth-shell-enter" : ""].filter(Boolean).join(" ");

  return (
    <div className={shellCls}>
      {header ? (
        header
      ) : (
        <>
          {eyebrow ? <p className="pf-auth-card-eyebrow">{eyebrow}</p> : null}
          {title ? <h2 className="pf-auth-card-title">{title}</h2> : null}
          {lede ? <p className="pf-auth-card-lede">{lede}</p> : null}
        </>
      )}
      {children}
      {footer ? <div style={{ marginTop: 22 }}>{footer}</div> : null}
    </div>
  );
}
