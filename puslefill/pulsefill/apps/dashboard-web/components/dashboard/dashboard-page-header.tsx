"use client";

import type { ReactNode } from "react";
import { PageCommandHeader } from "@/components/operator/page-command-header";

type DashboardPageHeaderProps = {
  /** Main line under the title (always visible). */
  description: ReactNode;
  eyebrowTone?: "caps" | "plain";
  /** Optional right-side meta (e.g. refresh affordance lives elsewhere). */
  meta?: ReactNode;
};

/**
 * Overview page chrome — one consistent header for `/overview`.
 */
export function DashboardPageHeader({ description, meta, eyebrowTone = "plain" }: DashboardPageHeaderProps) {
  return (
    <PageCommandHeader
      animate={false}
      tone="default"
      eyebrowTone={eyebrowTone}
      eyebrow="Today"
      title="Overview"
      description={description}
      meta={meta}
      style={{ marginBottom: 4 }}
    />
  );
}
