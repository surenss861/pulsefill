"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

const layoutEase = [0.22, 1, 0.36, 1] as const;

type DeskSecondaryCardProps = {
  title: string;
  /** Optional right-aligned control in the card header row. */
  headerAction?: ReactNode;
  /** `slip` / `ledger` = lighter desk artifacts on the sheet; `panel` = legacy elevated block. */
  variant?: "panel" | "slip" | "ledger";
  children: ReactNode;
};

function slugId(title: string): string {
  return `pf-desk-sec-${title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")}`;
}

/** Quieter supporting blocks — account, profile, checklist, security. */
export function DeskSecondaryCard({ title, headerAction, variant = "panel", children }: DeskSecondaryCardProps) {
  const id = slugId(title);
  const reduce = useReducedMotion();
  const surfaceClass =
    variant === "slip" ? " pf-desk-secondary-card--slip" : variant === "ledger" ? " pf-desk-secondary-card--ledger" : "";

  const inner = (
    <>
      <div className="pf-desk-secondary-card__head">
        <h2 id={id} className="pf-desk-secondary-card__title">
          {title}
        </h2>
        {headerAction ? <div className="pf-desk-secondary-card__action">{headerAction}</div> : null}
      </div>
      <div className="pf-desk-secondary-card__body">{children}</div>
    </>
  );

  if (reduce) {
    return (
      <section className={`pf-desk-secondary-card${surfaceClass}`} aria-labelledby={id}>
        {inner}
      </section>
    );
  }

  return (
    <motion.section
      className={`pf-desk-secondary-card${surfaceClass}`}
      aria-labelledby={id}
      layout
      transition={{ layout: { duration: 0.24, ease: layoutEase } }}
    >
      {inner}
    </motion.section>
  );
}
