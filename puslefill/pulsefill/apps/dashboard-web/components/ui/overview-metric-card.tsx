"use client";

import type { CSSProperties } from "react";
import { useEffect, useRef, useState } from "react";
import { AnimatedNumber } from "@/components/ui/animated-number";

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

/** Ember-led accents: recovery heat for offers/opens, neutral for volume, danger undertone only when label implies risk. */
function accentForKey(label: string): string {
  const l = label.toLowerCase();
  if (l.includes("fail") || l.includes("error") || l.includes("lost")) return "var(--pf-danger-border)";
  if (l.includes("booked") || l.includes("revenue")) return "var(--pf-accent-primary-border)";
  if (l.includes("offer")) return "var(--pf-accent-primary-border)";
  if (l.includes("created") || l.includes("open")) return "var(--pf-border-strong)";
  return "var(--pf-border-subtle)";
}

type Props = {
  label: string;
  value: number;
  isCurrency?: boolean;
};

export function OverviewMetricCard({ label, value, isCurrency = false }: Props) {
  const [flash, setFlash] = useState(false);
  const prev = useRef(value);

  useEffect(() => {
    if (prev.current !== value) {
      prev.current = value;
      setFlash(true);
      const id = window.setTimeout(() => setFlash(false), 480);
      return () => window.clearTimeout(id);
    }
  }, [value]);

  const borderColor = accentForKey(label);

  const shell: CSSProperties = {
    borderRadius: "var(--pf-radius-xl)",
    border: `1px solid ${borderColor}`,
    background: flash ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.04)",
    padding: "18px 20px",
    color: "var(--text)",
    transition: "background 0.35s ease, box-shadow 0.35s ease, border-color 0.35s ease",
    boxShadow: flash ? "0 0 0 1px rgba(255,255,255,0.06)" : "none",
  };

  return (
    <div style={shell}>
      <p style={{ margin: 0, fontSize: 13, color: "var(--muted)" }}>{label}</p>
      <p style={{ margin: "10px 0 0", fontSize: 28, fontWeight: 650, letterSpacing: "-0.02em" }}>
        {isCurrency ? (
          <AnimatedNumber value={value} formatter={(n) => formatCurrency(n)} />
        ) : (
          <AnimatedNumber value={value} formatter={(n) => n.toLocaleString("en-CA")} />
        )}
      </p>
    </div>
  );
}
