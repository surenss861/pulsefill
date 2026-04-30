"use client";

import { RecoveryPipeline, type RecoveryPipelineStepId } from "./recovery-pipeline";

export function MarketingRecoveryBlock({
  activeStep = "offers",
  compact = false,
  showTitle = true,
}: {
  activeStep?: RecoveryPipelineStepId;
  compact?: boolean;
  showTitle?: boolean;
}) {
  return (
    <div className="ms-recovery-block">
      {showTitle ? (
        <p className="pf-kicker" style={{ margin: "0 0 14px" }}>
          Recovery pipeline
        </p>
      ) : null}
      <RecoveryPipeline activeStep={activeStep} compact={compact} animated showFlowLabel={false} />
    </div>
  );
}
