"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";

export function SubmitButton({
  children,
  pendingText = "Working…",
  className,
}: {
  children: ReactNode;
  pendingText?: string;
  className?: string;
}) {
  const { pending } = useFormStatus();
  const cls = ["pf-auth-submit", className].filter(Boolean).join(" ");

  return (
    <button type="submit" disabled={pending} className={cls} style={{ opacity: pending ? 0.72 : 1, cursor: pending ? "not-allowed" : "pointer" }}>
      {pending ? pendingText : children}
    </button>
  );
}
