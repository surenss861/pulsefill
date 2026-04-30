import type { RecoveryPipelineStepId } from "@/components/operator/recovery-pipeline";

/** Maps API `open_slots.status` to the recovery pipeline highlight for operator UI. */
export function slotStatusToRecoveryPipelineActiveStep(status: string): RecoveryPipelineStepId | undefined {
  const s = status.toLowerCase();
  if (s === "open") return "opening";
  if (s === "offered") return "offers";
  if (s === "claimed") return "claim";
  if (s === "booked") return "confirmed";
  return undefined;
}

export function isSlotRecoveryTerminalStatus(status: string): boolean {
  const s = status.toLowerCase();
  return s === "expired" || s === "cancelled" || s === "failed";
}
