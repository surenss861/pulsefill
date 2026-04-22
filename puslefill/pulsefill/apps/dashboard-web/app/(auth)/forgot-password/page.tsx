"use client";

import Link from "next/link";
import { useActionState } from "react";
import { forgotPasswordAction, type AuthFormState } from "@/app/actions/auth";
import { AuthShell } from "@/components/auth/auth-shell";
import { AuthCard } from "@/components/auth/auth-card";
import { AuthField } from "@/components/auth/auth-field";
import { SubmitButton } from "@/components/auth/submit-button";

const initial: AuthFormState = {};

export default function ForgotPasswordPage() {
  const [state, formAction] = useActionState(forgotPasswordAction, initial);

  return (
    <AuthShell variant="center">
      <AuthCard
        title="Forgot password"
        description="Enter your email and we’ll send a secure reset link."
        showMobileWordmark
        footer={
          <div style={{ fontSize: 14, color: "var(--muted)" }}>
            <Link href="/sign-in">Back to sign in</Link>
          </div>
        }
      >
        <form action={formAction} style={{ display: "grid", gap: 20 }}>
          <AuthField label="Work email" name="email" type="email" placeholder="name@clinic.com" autoComplete="email" required />
          {state.error ? (
            <div
              style={{
                borderRadius: 16,
                border: "1px solid rgba(248, 113, 113, 0.28)",
                background: "rgba(248, 113, 113, 0.08)",
                padding: "12px 14px",
                fontSize: 14,
                color: "#fecaca",
              }}
            >
              {state.error}
            </div>
          ) : null}
          <SubmitButton pendingText="Sending link…">Send reset link</SubmitButton>
        </form>
      </AuthCard>
    </AuthShell>
  );
}
