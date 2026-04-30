import { MetricCard, type MetricCardEmphasis } from "@/components/ui/metric-card";
import type { CSSProperties } from "react";

export type OperatorMetricStripItem = {
  label: string;
  value: number | string;
  emphasis?: MetricCardEmphasis;
};

type OperatorMetricStripProps = {
  items: readonly OperatorMetricStripItem[];
  /** When true, metrics render in compact mode and the row is slightly de-emphasized. */
  compact?: boolean;
  style?: CSSProperties;
};

export function OperatorMetricStrip({ items, compact = false, style }: OperatorMetricStripProps) {
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: compact ? 8 : 10,
        opacity: compact ? 0.82 : 1,
        ...style,
      }}
    >
      {items.map((item) => (
        <MetricCard
          key={item.label}
          label={item.label}
          value={item.value}
          emphasis={item.emphasis ?? "default"}
          size={compact ? "compact" : "default"}
          style={{ flex: "1 1 100px", minWidth: compact ? 88 : 100 }}
        />
      ))}
    </div>
  );
}
