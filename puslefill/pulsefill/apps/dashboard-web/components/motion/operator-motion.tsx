"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

const easeOut = [0.22, 1, 0.36, 1] as const;

/** Soft entrance for operator sections; no motion when prefers-reduced-motion. */
export function FadeUp({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  const reduce = useReducedMotion();
  if (reduce) return <>{children}</>;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.26, delay, ease: easeOut }}
    >
      {children}
    </motion.div>
  );
}

const listContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

const listItem = {
  hidden: { opacity: 0, y: 5 },
  show: { opacity: 1, y: 0, transition: { duration: 0.22, ease: easeOut } },
};

/** Numbered workflow steps with a light stagger (Openings empty state, etc.). */
export function WorkflowSteps({ steps }: { steps: readonly string[] }) {
  const reduce = useReducedMotion();
  if (reduce) {
    return (
      <ol
        style={{
          margin: "10px 0 0",
          paddingLeft: 18,
          color: "var(--muted)",
          fontSize: 13,
          lineHeight: 1.55,
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        {steps.map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ol>
    );
  }
  return (
    <motion.ol
      style={{
        margin: "10px 0 0",
        paddingLeft: 18,
        color: "var(--muted)",
        fontSize: 13,
        lineHeight: 1.55,
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
      initial="hidden"
      animate="show"
      variants={listContainer}
    >
      {steps.map((s) => (
        <motion.li key={s} variants={listItem}>
          {s}
        </motion.li>
      ))}
    </motion.ol>
  );
}
