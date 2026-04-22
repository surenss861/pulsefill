"use client";

import { useId, useState } from "react";

export type PasswordFieldProps = {
  label: string;
  name: string;
  placeholder?: string;
  error?: string;
  autoComplete?: string;
};

export function PasswordField({
  label,
  name,
  placeholder,
  error,
  autoComplete = "current-password",
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const id = useId();
  const border = error ? "1px solid rgba(248, 113, 113, 0.55)" : "1px solid rgba(255,255,255,0.1)";
  const cls = ["pf-auth-input", error ? "pf-auth-input--error" : ""].join(" ");

  return (
    <div>
      <label htmlFor={id} style={{ display: "block" }}>
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
        <div style={{ position: "relative" }}>
          <input
            id={id}
            name={name}
            type={visible ? "text" : "password"}
            placeholder={placeholder}
            autoComplete={autoComplete}
            className={cls}
            style={{
              width: "100%",
              boxSizing: "border-box",
              borderRadius: 18,
              border,
              background: "#0a0f1a",
              padding: "16px 52px 16px 18px",
              minHeight: 56,
              fontSize: 15,
              color: "var(--text)",
              outline: "none",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)",
            }}
          />
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            style={{
              position: "absolute",
              right: 10,
              top: "50%",
              transform: "translateY(-50%)",
              border: "none",
              borderRadius: 12,
              padding: "8px 10px",
              fontSize: 12,
              fontWeight: 600,
              color: "rgba(245,247,250,0.55)",
              background: "rgba(255,255,255,0.04)",
              cursor: "pointer",
            }}
          >
            {visible ? "Hide" : "Show"}
          </button>
        </div>
      </label>
      {error ? (
        <p style={{ margin: "8px 0 0", fontSize: 13, color: "#fca5a5" }}>{error}</p>
      ) : null}
    </div>
  );
}
