"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signUpAction, type AuthFormState } from "@/app/actions/auth";
import { AuthShell } from "@/components/auth/auth-shell";
import { AuthBrandPanel } from "@/components/auth/auth-brand-panel";
import { AuthCard } from "@/components/auth/auth-card";
import { AuthField } from "@/components/auth/auth-field";
import { PasswordField } from "@/components/auth/password-field";
import { SubmitButton } from "@/components/auth/submit-button";

const initial: AuthFormState = {};

export default function SignUpPage() {
  const [state, formAction] = useActionState(signUpAction, initial);

  return (
    <AuthShell
      variant="split"
      brandPanel={
        <AuthBrandPanel
          eyebrow="Secure workspace setup"
          title="Create your recovery workspace."
          body="Set up PulseFill for queue visibility, team access, and recovered bookings."
          bullets={["Team access", "Recovery workflow", "Revenue visibility"]}
          recoveryActiveStep="opening"
          showRecoveryPipeline
        />
      }
    >
      <AuthCard
        title="Create workspace"
        description="Set up your operator account and connect your recovery workflow."
        footer={
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <span style={{ fontSize: 13, color: "rgba(169,162,154,0.82)" }}>
              Already have an account?{" "}
              <Link href="/sign-in" style={{ color: "rgba(253, 186, 116, 0.78)", fontWeight: 600 }}>
                Sign in
              </Link>
            </span>
            <span style={{ fontSize: 10, lineHeight: 1.45, color: "rgba(111,104,97,0.95)" }}>
              By continuing, you agree to PulseFill&apos;s Terms and Privacy Policy.
            </span>
          </div>
        }
      >
        <form action={formAction} style={{ display: "grid", gap: 20 }}>
          <AuthField label="Full name" name="name" type="text" placeholder="Your full name" autoComplete="name" required />
          <AuthField label="Work email" name="email" type="email" placeholder="name@clinic.com" autoComplete="email" required />
          <PasswordField
            label="Password"
            name="password"
            placeholder="Create a password"
            autoComplete="new-password"
          />
          <PasswordField
            label="Confirm password"
            name="confirmPassword"
            placeholder="Confirm your password"
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
          <SubmitButton pendingText="Creating workspace…">Create workspace</SubmitButton>
        </form>
      </AuthCard>
    </AuthShell>
  );
}
