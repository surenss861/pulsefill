"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";

export function SubmitButton({
  children,
  pendingText = "Working…",
}: {
  children: ReactNode;
  pendingText?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      style={{
        display: "inline-flex",
        width: "100%",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 16,
        border: "none",
        padding: "16px 20px",
        minHeight: 52,
        fontSize: 14,
        fontWeight: 650,
        color: "var(--pf-btn-primary-text)",
        background: "var(--pf-btn-primary-bg)",
        boxShadow: "var(--pf-btn-primary-shadow)",
        cursor: pending ? "not-allowed" : "pointer",
        opacity: pending ? 0.72 : 1,
        transition: "filter 140ms ease, transform 140ms ease, opacity 140ms ease",
      }}
    >
      {pending ? pendingText : children}
    </button>
  );
}
