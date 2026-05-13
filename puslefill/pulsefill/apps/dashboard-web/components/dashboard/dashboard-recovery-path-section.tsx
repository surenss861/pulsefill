"use client";

import { RecoveryPipeline, type RecoveryPipelineStepId } from "@/components/operator/recovery-pipeline";

type DashboardRecoveryPathSectionProps = {
  activeStep?: RecoveryPipelineStepId;
  counts?: Partial<Record<RecoveryPipelineStepId, number>>;
};

/**
 * Full-width recovery workflow strip — same mental model as the marketing case file,
 * anchored as a first-class surface (not a narrow sidebar rail).
 */
export function DashboardRecoveryPathSection({ activeStep, counts }: DashboardRecoveryPathSectionProps) {
  return (
    <section className="pf-dashboard-recovery-path" aria-labelledby="pf-dashboard-recovery-path-heading">
      <p id="pf-dashboard-recovery-path-heading" className="pf-kicker" style={{ margin: "0 0 14px" }}>
        What happens next
      </p>
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
