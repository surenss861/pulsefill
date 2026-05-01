import type { CSSProperties, ReactNode } from "react";
import { OperatorEmptyState } from "@/components/operator/operator-empty-state";

type OperatorListEmptyStateProps = {
  title: string;
  description: ReactNode;
  primaryAction?: ReactNode;
  secondaryAction?: ReactNode;
  visual?: ReactNode;
  compact?: boolean;
  style?: CSSProperties;
};

/** List/table empty state — next move + optional secondary link. */
export function OperatorListEmptyState({
  title,
  description,
  primaryAction,
  secondaryAction,
  visual,
  compact = false,
  style,
}: OperatorListEmptyStateProps) {
  const secondaryContent =
    secondaryAction != null ? (
      <div style={{ fontSize: 13 }}>{secondaryAction}</div>
    ) : undefined;

  return (
    <OperatorEmptyState
      title={title}
      description={description}
      visual={visual}
      primaryAction={primaryAction}
      secondaryContent={secondaryContent}
      style={{
        padding: compact ? "16px 16px 14px" : undefined,
        ...style,
      }}
    />
  );
}
