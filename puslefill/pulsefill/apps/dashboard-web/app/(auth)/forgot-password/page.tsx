"use client";

import Link from "next/link";
import { useActionState } from "react";
import { forgotPasswordAction, type AuthFormState } from "@/app/actions/auth";
import { AuthWarmCard } from "@/components/auth/auth-warm-card";
import { AUTH_RECOVERY_BENEFITS, AuthWarmSplit } from "@/components/auth/auth-warm-split";
import { AuthField } from "@/components/auth/auth-field";
import { SubmitButton } from "@/components/auth/submit-button";

const initial: AuthFormState = {};

export default function ForgotPasswordPage() {
  const [state, formAction] = useActionState(forgotPasswordAction, initial);

  return (
    <AuthWarmSplit
      headline="Get back into your workspace."
      subhead="We'll email a secure reset link. Nothing changes until you confirm from your inbox."
      benefits={AUTH_RECOVERY_BENEFITS}
      showCasePreview
    >
      <AuthWarmCard
        eyebrow="Account help"
        title="Forgot password"
        lede={"Enter the email you use for PulseFill and we'll send a reset link."}
        footer={
          <div className="pf-auth-footer" style={{ marginTop: 0, paddingTop: 0, borderTop: "none" }}>
            <Link href="/sign-in">Back to sign in</Link>
          </div>
        }
      >
        <form action={formAction} style={{ display: "grid", gap: 0 }}>
          <AuthField label="Email" name="email" type="email" placeholder="you@clinic.com" autoComplete="email" required />
          {state.error ? <div className="pf-auth-error-banner">{state.error}</div> : null}
          <div style={{ marginTop: 8 }}>
            <SubmitButton pendingText="Sending link…">Send reset link</SubmitButton>
          </div>
        </form>
      </AuthWarmCard>
    </AuthWarmSplit>
  );
}
