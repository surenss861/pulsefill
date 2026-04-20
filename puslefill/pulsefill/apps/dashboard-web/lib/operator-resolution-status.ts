export const OPERATOR_RESOLUTION_STATUSES = [
  { value: "none", label: "None" },
  { value: "handled_manually", label: "Handled manually" },
  { value: "no_retry_needed", label: "No retry needed" },
  { value: "customer_contacted", label: "Customer contacted" },
  { value: "provider_unavailable", label: "Provider unavailable" },
  { value: "ignore", label: "Ignore" },
] as const;

export type OperatorResolutionStatusValue = (typeof OPERATOR_RESOLUTION_STATUSES)[number]["value"];
