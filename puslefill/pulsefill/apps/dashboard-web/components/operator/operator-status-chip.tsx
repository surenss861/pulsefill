import { StatusPill, type StatusPillVariant } from "@/components/ui/status-pill";

export type OperatorStatusKind =
  | "setup"
  | "live"
  | "pending"
  | "confirmed"
  | "expired"
  | "cancelled"
  | "failed"
  | "inactive"
  | "draft"
  | "attention";

const kindToLabel: Record<OperatorStatusKind, string> = {
  setup: "Setup",
  live: "Live",
  pending: "Pending",
  confirmed: "Confirmed",
  expired: "Expired",
  cancelled: "Cancelled",
  failed: "Failed",
  inactive: "Inactive",
  draft: "Draft",
  attention: "Needs attention",
};

const kindToVariant: Record<OperatorStatusKind, StatusPillVariant> = {
  setup: "muted",
  live: "primary",
  pending: "default",
  confirmed: "resolved",
  expired: "muted",
  cancelled: "muted",
  failed: "danger",
  inactive: "muted",
  draft: "muted",
  attention: "primary",
};

type OperatorStatusChipProps = {
  kind: OperatorStatusKind;
  /** Override default label for kind */
  label?: string;
  caps?: boolean;
};

/** Semantic recovery status — maps to warm StatusPill variants (no blue/cyan). */
export function OperatorStatusChip({ kind, label, caps = false }: OperatorStatusChipProps) {
  return (
    <StatusPill variant={kindToVariant[kind]} caps={caps}>
      {label ?? kindToLabel[kind]}
    </StatusPill>
  );
}
