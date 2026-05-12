"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signUpAction, type AuthFormState } from "@/app/actions/auth";
import { AuthWarmCard } from "@/components/auth/auth-warm-card";
import { AUTH_RECOVERY_BENEFITS, AuthWarmSplit } from "@/components/auth/auth-warm-split";
import { AuthField } from "@/components/auth/auth-field";
import { PasswordField } from "@/components/auth/password-field";
import { SubmitButton } from "@/components/auth/submit-button";

const initial: AuthFormState = {};

export default function SignUpPage() {
  const [state, formAction] = useActionState(signUpAction, initial);

  return (
    <AuthWarmSplit
      headline="Create your workspace for recovery."
      subhead="Set up staff access so your team can turn cancellations into confirmed bookings — with offers, claims, and one calm queue."
      benefits={AUTH_RECOVERY_BENEFITS}
      showCasePreview
    >
      <AuthWarmCard
        eyebrow="New workspace"
        title="Create account"
        lede="Add your details to start using PulseFill for your business."
        footer={
          <>
            <div className="pf-auth-footer">
              <span style={{ color: "var(--pf-text-muted)", fontWeight: 500, fontSize: 13 }}>
                Already have an account? <Link href="/sign-in">Sign in</Link>
              </span>
            </div>
            <p className="pf-auth-reassure" style={{ marginTop: 4 }}>
              By continuing, you agree to PulseFill&apos;s Terms and Privacy Policy.
            </p>
          </>
        }
      >
        <form action={formAction} style={{ display: "grid", gap: 0 }}>
          <AuthField label="Full name" name="name" type="text" placeholder="Your full name" autoComplete="name" required />
          <AuthField label="Email" name="email" type="email" placeholder="you@clinic.com" autoComplete="email" required />
          <PasswordField label="Password" name="password" placeholder="Create a password" autoComplete="new-password" />
          <PasswordField
            label="Confirm password"
            name="confirmPassword"
            placeholder="Confirm your password"
            autoComplete="new-password"
          />
          {state.error ? <div className="pf-auth-error-banner">{state.error}</div> : null}
          <div style={{ marginTop: 8 }}>
            <SubmitButton pendingText="Creating workspace…">Create workspace</SubmitButton>
          </div>
        </form>
      </AuthWarmCard>
    </AuthWarmSplit>
  );
}
