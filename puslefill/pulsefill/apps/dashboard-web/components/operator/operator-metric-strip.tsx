import { MetricCard, type MetricCardEmphasis } from "@/components/ui/metric-card";
import type { CSSProperties } from "react";

export type OperatorMetricStripItem = {
  label: string;
  value: number | string;
  emphasis?: MetricCardEmphasis;
  /** Muted when zero / idle unless overridden. */
  signal?: "idle" | "live";
  hint?: string;
  /** When set, the card renders as a control (e.g. apply a list filter). */
  onClick?: () => void;
  ariaLabel?: string;
  ariaPressed?: boolean;
};

type OperatorMetricStripProps = {
  items: readonly OperatorMetricStripItem[];
  /** When true, metrics render in compact mode and the row is slightly de-emphasized. */
  compact?: boolean;
  style?: CSSProperties;
  /** Merged onto the strip container (e.g. responsive grid layout hooks). */
  stripClassName?: string;
};

function defaultSignal(item: OperatorMetricStripItem): "idle" | "live" {
  if (item.signal) return item.signal;
  if (typeof item.value === "number") return item.value === 0 ? "idle" : "live";
  return "live";
}

export function OperatorMetricStrip({ items, compact = false, style, stripClassName }: OperatorMetricStripProps) {
  const sc = stripClassName ?? "";
  const cssGridLayout =
    sc.includes("pf-onboarding-metric-strip--customers") || sc.includes("pf-customers-pool-metrics");

  return (
    <div
      className={["pf-operator-metric-strip", stripClassName].filter(Boolean).join(" ")}
      style={{
        ...(cssGridLayout
          ? {}
          : {
              display: "flex",
              flexWrap: "wrap",
              gap: compact ? 8 : 10,
              alignItems: "stretch",
            }),
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
            onClick={item.onClick}
            ariaLabel={item.ariaLabel}
            ariaPressed={item.ariaPressed}
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
