"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const easeOut = [0.22, 1, 0.36, 1] as const;

/**
 * Shared route transition for the protected desk shell — subtle “new sheet on the desk”
 * (fade, slight rise, tiny scale, blur settle). Does not block pointer events.
 */
export function WorkspaceRouteMorph({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const reduce = useReducedMotion();

  if (reduce) {
    return <div className="pf-workspace-route-slot">{children}</div>;
  }

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        className="pf-workspace-route-slot"
        initial={{ opacity: 0, y: 10, scale: 0.985, filter: "blur(6px)" }}
        animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
        exit={{ opacity: 0, y: 8, scale: 0.99, filter: "blur(4px)" }}
        transition={{ duration: 0.28, ease: easeOut }}
        style={{ transformOrigin: "50% 12%" }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
