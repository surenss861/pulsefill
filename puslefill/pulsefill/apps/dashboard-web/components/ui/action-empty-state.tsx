"use client";

import { PageState } from "@/components/ui/page-state";

export function ActionEmptyState({
  title,
  description,
  ctaLabel,
  ctaHref,
}: {
  title: string;
  description: string;
  ctaLabel?: string;
  ctaHref?: string;
}) {
  return <PageState variant="empty" title={title} description={description} ctaLabel={ctaLabel} ctaHref={ctaHref} />;
}
