import type { ReactNode } from "react";

type AuthWarmCardProps = {
  eyebrow?: string;
  title: string;
  lede?: string;
  children: ReactNode;
  /** Optional region below children (e.g. links); not auto-wrapped in `pf-auth-footer`. */
  footer?: ReactNode;
};

/** Walnut case-file style card — same surface system as `/sign-in`. */
export function AuthWarmCard({ eyebrow, title, lede, children, footer }: AuthWarmCardProps) {
  return (
    <div className="pf-auth-card pf-auth-shell-enter">
      {eyebrow ? <p className="pf-auth-card-eyebrow">{eyebrow}</p> : null}
      <h2 className="pf-auth-card-title">{title}</h2>
      {lede ? <p className="pf-auth-card-lede">{lede}</p> : null}
      {children}
      {footer ? <div style={{ marginTop: 22 }}>{footer}</div> : null}
    </div>
  );
}
