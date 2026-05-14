"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

const layoutEase = [0.22, 1, 0.36, 1] as const;

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
  const reduce = useReducedMotion();

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
      <section className="pf-desk-secondary-card" aria-labelledby={id}>
        {inner}
      </section>
    );
  }

  return (
    <motion.section
      className="pf-desk-secondary-card"
      aria-labelledby={id}
      layout
      transition={{ layout: { duration: 0.24, ease: layoutEase } }}
    >
      {inner}
    </motion.section>
  );
}
