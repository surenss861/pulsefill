"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { CSSProperties, ReactNode } from "react";

const easeTap = [0.22, 1, 0.36, 1] as const;

type MotionActionProps = {
  children: ReactNode;
  /** When true, skip hover/tap motion. */
  disabled?: boolean;
  className?: string;
  style?: CSSProperties;
};

/** Tactile affordance for primary-style links / small CTAs (inline). */
export function MotionAction({ children, disabled, className, style }: MotionActionProps) {
  const reduce = useReducedMotion();
  if (reduce || disabled) {
    return (
      <span className={className} style={{ display: "inline-flex", ...style }}>
        {children}
      </span>
    );
  }
  return (
    <motion.span
      className={className}
      style={{ display: "inline-flex", ...style }}
      whileHover={{ y: -1, transition: { duration: 0.16, ease: easeTap } }}
      whileTap={{ scale: 0.98, transition: { duration: 0.12, ease: easeTap } }}
    >
      {children}
    </motion.span>
  );
}

type MotionTapSurfaceProps = {
  children: ReactNode;
  disabled?: boolean;
  className?: string;
  style?: CSSProperties;
};

/** Tactile wrapper for primary buttons (block / inline-flex). */
export function MotionTapSurface({ children, disabled, className, style }: MotionTapSurfaceProps) {
  const reduce = useReducedMotion();
  if (reduce || disabled) {
    return (
      <span className={className} style={{ display: "inline-flex", ...style }}>
        {children}
      </span>
    );
  }
  return (
    <motion.span
      className={className}
      style={{ display: "inline-flex", ...style }}
      whileHover={{
        boxShadow: "0 12px 32px rgba(255, 122, 24, 0.22)",
        transition: { duration: 0.18, ease: easeTap },
      }}
      whileTap={{ scale: 0.98, transition: { duration: 0.12, ease: easeTap } }}
    >
      {children}
    </motion.span>
  );
}
