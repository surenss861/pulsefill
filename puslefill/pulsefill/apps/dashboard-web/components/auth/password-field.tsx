"use client";

import { useId, useState, type ChangeEventHandler } from "react";

export type PasswordFieldProps = {
  label: string;
  name: string;
  placeholder?: string;
  error?: string;
  autoComplete?: string;
  value?: string;
  onChange?: ChangeEventHandler<HTMLInputElement>;
  required?: boolean;
};

export function PasswordField({
  label,
  name,
  placeholder,
  error,
  autoComplete = "current-password",
  value,
  onChange,
  required,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const rawId = useId();
  const id = `pf-auth-pw-${rawId.replace(/:/g, "")}`;
  const cls = ["pf-auth-input", "pf-auth-input--password", error ? "pf-auth-input--error" : ""]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="pf-auth-field">
      <label className="pf-auth-label" htmlFor={id}>
        {label}
      </label>
      <div style={{ position: "relative" }}>
        <input
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className={cls}
          {...(value !== undefined ? { value } : {})}
          {...(onChange ? { onChange } : {})}
          {...(required ? { required: true } : {})}
          style={error ? { borderColor: "var(--pf-danger-border)" } : undefined}
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
            borderRadius: 8,
            padding: "6px 8px",
            fontSize: 12,
            fontWeight: 600,
            color: "var(--pf-text-muted)",
            background: "transparent",
            cursor: "pointer",
          }}
        >
          {visible ? "Hide" : "Show"}
        </button>
      </div>
      {error ? <p style={{ margin: "6px 0 0", fontSize: 13, color: "#fca5a5" }}>{error}</p> : null}
    </div>
  );
}
