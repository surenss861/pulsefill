import type { ReactNode } from "react";

/** Max-width page shell for signed-in desk surfaces. */
export function DeskPage({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={["pf-desk-page", className].filter(Boolean).join(" ")}>{children}</div>;
}
