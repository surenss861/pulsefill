import type { ReactNode } from "react";

export type DeskDlRow = { term: string; detail: ReactNode };

/** Readable definition list for settings-style rows (not dense admin tables). */
export function DeskDl({ rows }: { rows: readonly DeskDlRow[] }) {
  return (
    <dl className="pf-desk-dl">
      {rows.map((row) => (
        <div key={row.term} className="pf-desk-dl__row">
          <dt className="pf-desk-dl__term">{row.term}</dt>
          <dd className="pf-desk-dl__detail">{row.detail}</dd>
        </div>
      ))}
    </dl>
  );
}
