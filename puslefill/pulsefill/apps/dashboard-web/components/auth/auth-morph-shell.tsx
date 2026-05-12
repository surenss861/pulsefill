"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AUTH_RECOVERY_BENEFITS, AuthWarmSplit } from "@/components/auth/auth-warm-split";
import { AuthWarmCard } from "@/components/auth/auth-warm-card";
import { AUTH_MORPH_COPY, authMorphModeFromPath, type AuthMorphMode } from "@/components/auth/auth-morph-copy";

const ease = [0.22, 1, 0.36, 1] as const;

type AuthMorphShellProps = {
  children: ReactNode;
};

function MorphHeader({ mode }: { mode: AuthMorphMode }) {
  const c = AUTH_MORPH_COPY[mode];
  return (
    <div className="pf-auth-morph-header">
      <p className="pf-auth-card-eyebrow">{c.eyebrow}</p>
      <h2 className="pf-auth-card-title">{c.title}</h2>
      <p className="pf-auth-card-lede">{c.lede}</p>
    </div>
  );
}

/**
 * Shared warm split + case preview + card chrome for `/sign-in` and `/sign-up`.
 * Route changes swap `children` with a soft fade/slide and layout-friendly height handoff.
 */
export function AuthMorphShell({ children }: AuthMorphShellProps) {
  const pathname = usePathname();
  const mode = authMorphModeFromPath(pathname) ?? "sign-in";
  const reduce = useReducedMotion();

  const duration = reduce ? 0.12 : 0.32;
  const initial = reduce ? { opacity: 0.88 } : { opacity: 0, y: 8 };
  const exit = reduce ? { opacity: 0.9 } : { opacity: 0, y: -6 };
  const animate = { opacity: 1, y: 0 };

  return (
    <AuthWarmSplit
      leadingStory={
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={mode}
            className="pf-auth-morph-story"
            initial={initial}
            animate={animate}
            exit={exit}
            transition={{ duration, ease }}
          >
            <h1 className="pf-auth-lede">{AUTH_MORPH_COPY[mode].headline}</h1>
            <p className="pf-auth-sub">{AUTH_MORPH_COPY[mode].subhead}</p>
          </motion.div>
        </AnimatePresence>
      }
      benefits={AUTH_RECOVERY_BENEFITS}
      showCasePreview
    >
      <AuthWarmCard
        animateEnter={false}
        header={
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={mode}
              className="pf-auth-morph-header-wrap"
              initial={initial}
              animate={animate}
              exit={exit}
              transition={{ duration, ease }}
            >
              <MorphHeader mode={mode} />
            </motion.div>
          </AnimatePresence>
        }
      >
        <div className="pf-auth-morph-body">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={pathname ?? mode}
              className="pf-auth-morph-panel"
              initial={initial}
              animate={animate}
              exit={exit}
              transition={{
                duration,
                ease,
                ...(!reduce ? { layout: { duration: 0.28, ease } } : {}),
              }}
              layout={!reduce}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </AuthWarmCard>
    </AuthWarmSplit>
  );
}
