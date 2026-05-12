"use client";

import type { ReactNode } from "react";
import { PageCommandHeader } from "@/components/operator/page-command-header";

type DashboardPageHeaderProps = {
  /** Main line under the title (always visible). */
  description: ReactNode;
  /** Optional right-side meta (e.g. refresh affordance lives elsewhere). */
  meta?: ReactNode;
};

/**
 * Command Center page chrome — one consistent header for `/overview`.
 */
export function DashboardPageHeader({ description, meta }: DashboardPageHeaderProps) {
  return (
    <PageCommandHeader
      animate={false}
      tone="default"
      eyebrow="Command Center"
      title="Overview"
      description={description}
      meta={meta}
      style={{ marginBottom: 4 }}
    />
  );
}
