"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  value: number;
  durationMs?: number;
  formatter?: (n: number) => string;
};

/** Subtle count-up when `value` changes (integers / cents). */
export function AnimatedNumber({
  value,
  durationMs = 720,
  formatter = (n) => n.toLocaleString("en-CA"),
}: Props) {
  const [display, setDisplay] = useState(0);
  const frameRef = useRef<number | null>(null);
  const fromRef = useRef(0);

  useEffect(() => {
    const from = fromRef.current;
    const to = value;
    if (from === to) return;

    const start = performance.now();
    if (frameRef.current != null) {
      cancelAnimationFrame(frameRef.current);
    }

    function tick(now: number) {
      const elapsed = now - start;
      const t = Math.min(elapsed / durationMs, 1);
      const eased = 1 - (1 - t) ** 3;
      const next = Math.round(from + (to - from) * eased);
      setDisplay(next);
      fromRef.current = next;

      if (t < 1) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = to;
        setDisplay(to);
        frameRef.current = null;
      }
    }

    frameRef.current = requestAnimationFrame(tick);

    return () => {
      if (frameRef.current != null) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };
  }, [value, durationMs]);

  return <>{formatter(display)}</>;
}
