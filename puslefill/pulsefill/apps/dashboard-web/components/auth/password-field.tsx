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
  const border = error ? "1px solid var(--pf-danger-border)" : `1px solid var(--pf-auth-input-border)`;
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
            color: "rgba(169,162,154,0.92)",
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
              background: "var(--pf-auth-input-bg)",
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
              right: 8,
              top: "50%",
              transform: "translateY(-50%)",
              border: "none",
              borderRadius: 10,
              padding: "6px 8px",
              fontSize: 11,
              fontWeight: 500,
              letterSpacing: "0.04em",
              color: "rgba(169,162,154,0.85)",
              background: "transparent",
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
