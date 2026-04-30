import { PageCommandHeader } from "@/components/operator/page-command-header";

/** Lightweight page frame — the next move lives in `NextBestActionCard` below. */
export function OverviewOperatorHero() {
  return (
    <PageCommandHeader
      animate={false}
      tone="default"
      eyebrow="Command Center"
      title="Overview"
      description="PulseFill watches your recovery queue and highlights the next move directly below."
      style={{ marginBottom: 4 }}
    />
  );
}
