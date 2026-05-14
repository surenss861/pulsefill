"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

const layoutEase = [0.22, 1, 0.36, 1] as const;

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
  const reduce = useReducedMotion();

  const inner = (
    <>
      {eyebrow ? <p className="pf-desk-hero-card__eyebrow">{eyebrow}</p> : null}
      <h2 id={titleId} className="pf-desk-hero-card__title">
        {title}
      </h2>
      <div className="pf-desk-hero-card__body">{children}</div>
    </>
  );

  if (reduce) {
    return (
      <section className="pf-desk-hero-card" aria-labelledby={titleId}>
        {inner}
      </section>
    );
  }

  return (
    <motion.section
      className="pf-desk-hero-card"
      aria-labelledby={titleId}
      layout
      transition={{ layout: { duration: 0.24, ease: layoutEase } }}
    >
      {inner}
    </motion.section>
  );
}
