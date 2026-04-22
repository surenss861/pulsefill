import type { InputHTMLAttributes } from "react";

export type AuthFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
};

export function AuthField({ label, error, style, className, ...props }: AuthFieldProps) {
  const border = error ? "1px solid rgba(248, 113, 113, 0.55)" : "1px solid rgba(255,255,255,0.1)";
  const cls = ["pf-auth-input", error ? "pf-auth-input--error" : "", className].filter(Boolean).join(" ");

  return (
    <label style={{ display: "block" }}>
      <span
        style={{
          display: "block",
          marginBottom: 10,
          fontSize: 11,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.2em",
          color: "rgba(245,247,250,0.48)",
        }}
      >
        {label}
      </span>
      <input
        {...props}
        className={cls}
        style={{
          width: "100%",
          boxSizing: "border-box",
          borderRadius: 18,
          border,
          background: "#0a0f1a",
          padding: "16px 18px",
          minHeight: 56,
          fontSize: 15,
          color: "var(--text)",
          outline: "none",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)",
          transition: "border-color 140ms ease, box-shadow 140ms ease",
          ...style,
        }}
      />
      {error ? (
        <p style={{ margin: "8px 0 0", fontSize: 13, color: "#fca5a5" }}>{error}</p>
      ) : null}
    </label>
  );
}
