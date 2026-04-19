import type { CSSProperties, MouseEvent } from "react";

/** Shared inline styles for primary/secondary dashboard buttons. */
export const pressablePrimary: CSSProperties = {
  borderRadius: 16,
  border: "none",
  background: "var(--primary)",
  color: "#0a0c10",
  padding: "10px 16px",
  fontWeight: 600,
  cursor: "pointer",
  transition: "transform 0.15s ease, opacity 0.15s ease, filter 0.15s ease",
};

export const pressableSecondary: CSSProperties = {
  borderRadius: 16,
  border: "1px solid rgba(255,255,255,0.15)",
  background: "rgba(255,255,255,0.06)",
  color: "var(--text)",
  padding: "10px 16px",
  fontSize: 14,
  cursor: "pointer",
  transition: "transform 0.15s ease, opacity 0.15s ease, background 0.15s ease",
};

export function pressableHandlers(disabled: boolean) {
  if (disabled) {
    return {};
  }
  return {
    onMouseDown: (e: MouseEvent<HTMLButtonElement>) => {
      e.currentTarget.style.transform = "scale(0.985)";
    },
    onMouseUp: (e: MouseEvent<HTMLButtonElement>) => {
      e.currentTarget.style.transform = "scale(1)";
    },
    onMouseLeave: (e: MouseEvent<HTMLButtonElement>) => {
      e.currentTarget.style.transform = "scale(1)";
    },
  };
}
