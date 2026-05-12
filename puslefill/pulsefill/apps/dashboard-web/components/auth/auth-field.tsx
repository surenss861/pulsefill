import { useId, type InputHTMLAttributes } from "react";

export type AuthFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
};

export function AuthField({ label, error, style, className, id, ...props }: AuthFieldProps) {
  const autoId = useId();
  const fieldId = id ?? `pf-auth-field-${autoId.replace(/:/g, "")}`;
  const cls = ["pf-auth-input", error ? "pf-auth-input--error" : "", className].filter(Boolean).join(" ");

  return (
    <div className="pf-auth-field">
      <label className="pf-auth-label" htmlFor={fieldId}>
        {label}
      </label>
      <input
        {...props}
        id={fieldId}
        className={cls}
        style={{
          ...(error ? { borderColor: "var(--pf-danger-border)" } : {}),
          ...style,
        }}
      />
      {error ? <p style={{ margin: "6px 0 0", fontSize: 13, color: "#fca5a5" }}>{error}</p> : null}
    </div>
  );
}
