"use client";

import Link from "next/link";
import { useActionState } from "react";
import { resetPasswordAction, type AuthFormState } from "@/app/actions/auth";
import { AuthWarmCard } from "@/components/auth/auth-warm-card";
import { AUTH_RECOVERY_BENEFITS, AuthWarmSplit } from "@/components/auth/auth-warm-split";
import { PasswordField } from "@/components/auth/password-field";
import { SubmitButton } from "@/components/auth/submit-button";

const initial: AuthFormState = {};

export default function ResetPasswordPage() {
  const [state, formAction] = useActionState(resetPasswordAction, initial);

  return (
    <AuthWarmSplit
      headline="Set a new password."
      subhead="Use the link from your email so we know it's you — then you can return to openings, claims, and confirmations."
      benefits={AUTH_RECOVERY_BENEFITS}
      showCasePreview
    >
      <AuthWarmCard
        eyebrow="Secure update"
        title="Reset password"
        lede="Choose a new password for your account. This page only works from the link in your email."
        footer={
          <div className="pf-auth-footer" style={{ marginTop: 0, paddingTop: 0, borderTop: "none" }}>
            <Link href="/sign-in">Back to sign in</Link>
          </div>
        }
      >
        <form action={formAction} style={{ display: "grid", gap: 0 }}>
          <PasswordField label="New password" name="password" placeholder="Enter a new password" autoComplete="new-password" />
          <PasswordField
            label="Confirm new password"
            name="confirmPassword"
            placeholder="Confirm your new password"
            autoComplete="new-password"
          />
          {state.error ? <div className="pf-auth-error-banner">{state.error}</div> : null}
          <div style={{ marginTop: 8 }}>
            <SubmitButton pendingText="Updating password…">Update password</SubmitButton>
          </div>
        </form>
      </AuthWarmCard>
    </AuthWarmSplit>
  );
}
