"use client";

import { useActionState } from "react";
import { signUpAction, type AuthFormState } from "@/app/actions/auth";
import { AuthField } from "@/components/auth/auth-field";
import { PasswordField } from "@/components/auth/password-field";
import { SubmitButton } from "@/components/auth/submit-button";
import { AuthModeTransitionLink } from "@/components/auth/auth-mode-transition-link";

const initial: AuthFormState = {};

export default function SignUpClient() {
  const [state, formAction] = useActionState(signUpAction, initial);

  return (
    <>
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
          <SubmitButton pendingText="Creating account…">Create account</SubmitButton>
        </div>
      </form>

      <div className="pf-auth-footer" style={{ marginTop: 22 }}>
        <span style={{ color: "var(--pf-text-muted)", fontWeight: 500, fontSize: 13 }}>
          Already have an account? <AuthModeTransitionLink href="/sign-in">Sign in</AuthModeTransitionLink>
        </span>
      </div>
      <p className="pf-auth-reassure" style={{ marginTop: 4 }}>
        By continuing, you agree to PulseFill&apos;s Terms and Privacy Policy.
      </p>
    </>
  );
}
