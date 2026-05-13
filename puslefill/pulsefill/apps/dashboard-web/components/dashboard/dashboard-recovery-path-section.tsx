"use client";

import { RecoveryPipeline, type RecoveryPipelineStepId } from "@/components/operator/recovery-pipeline";

type DashboardRecoveryPathSectionProps = {
  activeStep?: RecoveryPipelineStepId;
  counts?: Partial<Record<RecoveryPipelineStepId, number>>;
  /** When the parent already provides a section title (e.g. Operations desk card). */
  hideTitle?: boolean;
};

/**
 * Full-width recovery workflow strip — same mental model as the marketing case file,
 * anchored as a first-class surface (not a narrow sidebar rail).
 */
export function DashboardRecoveryPathSection({ activeStep, counts, hideTitle }: DashboardRecoveryPathSectionProps) {
  return (
    <section
      className="pf-dashboard-recovery-path"
      aria-labelledby={hideTitle ? undefined : "pf-dashboard-recovery-path-heading"}
      aria-label={hideTitle ? "What happens next" : undefined}
    >
      {hideTitle ? null : (
        <p id="pf-dashboard-recovery-path-heading" className="pf-eyebrow-plain" style={{ margin: "0 0 14px" }}>
          What happens next
        </p>
      )}
      <RecoveryPipeline
        activeStep={activeStep}
        counts={counts}
        compact={false}
        animated
        featured={false}
        interactive
        workflowStrip
        stepNumbers
        sentenceCaseTitles
        showFlowLabel={false}
      />
    </section>
  );
}
