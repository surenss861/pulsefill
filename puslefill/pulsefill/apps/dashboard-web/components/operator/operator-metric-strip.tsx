import { MetricCard, type MetricCardEmphasis } from "@/components/ui/metric-card";
import type { CSSProperties } from "react";

export type OperatorMetricStripItem = {
  label: string;
  value: number | string;
  emphasis?: MetricCardEmphasis;
  /** Muted when zero / idle unless overridden. */
  signal?: "idle" | "live";
  hint?: string;
};

type OperatorMetricStripProps = {
  items: readonly OperatorMetricStripItem[];
  /** When true, metrics render in compact mode and the row is slightly de-emphasized. */
  compact?: boolean;
  style?: CSSProperties;
};

function defaultSignal(item: OperatorMetricStripItem): "idle" | "live" {
  if (item.signal) return item.signal;
  if (typeof item.value === "number") return item.value === 0 ? "idle" : "live";
  return "live";
}

export function OperatorMetricStrip({ items, compact = false, style }: OperatorMetricStripProps) {
  return (
    <div
      className="pf-operator-metric-strip"
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: compact ? 8 : 10,
        alignItems: "stretch",
        ...style,
      }}
    >
      {items.map((item) => {
        const sig = defaultSignal(item);
        const emphasis = sig === "live" ? (item.emphasis ?? "default") : "default";
        return (
          <MetricCard
            key={item.label}
            label={item.label}
            value={item.value}
            emphasis={emphasis}
            signal={sig}
            hint={item.hint}
            size={compact ? "compact" : "default"}
            style={{
              flex: "1 1 min(168px, 100%)",
              minWidth: compact ? 80 : 96,
              maxWidth: "100%",
            }}
          />
        );
      })}
    </div>
  );
}
