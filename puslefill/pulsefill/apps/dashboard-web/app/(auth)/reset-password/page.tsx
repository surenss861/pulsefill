"use client";

import Link from "next/link";
import { useActionState } from "react";
import { resetPasswordAction, type AuthFormState } from "@/app/actions/auth";
import { AuthShell } from "@/components/auth/auth-shell";
import { AuthCard } from "@/components/auth/auth-card";
import { PasswordField } from "@/components/auth/password-field";
import { SubmitButton } from "@/components/auth/submit-button";

const initial: AuthFormState = {};

export default function ResetPasswordPage() {
  const [state, formAction] = useActionState(resetPasswordAction, initial);

  return (
    <AuthShell variant="center">
      <AuthCard
        title="Reset password"
        description="Set a new password to regain access to PulseFill. Use the link from your email so this session stays valid."
        showMobileWordmark
        footer={
          <div style={{ fontSize: 14, color: "var(--muted)" }}>
            <Link href="/sign-in">Back to sign in</Link>
          </div>
        }
      >
        <form action={formAction} style={{ display: "grid", gap: 20 }}>
          <PasswordField label="New password" name="password" placeholder="Enter a new password" autoComplete="new-password" />
          <PasswordField
            label="Confirm new password"
            name="confirmPassword"
            placeholder="Confirm your new password"
            autoComplete="new-password"
          />
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
          <SubmitButton pendingText="Updating password…">Update password</SubmitButton>
        </form>
      </AuthCard>
    </AuthShell>
  );
}
