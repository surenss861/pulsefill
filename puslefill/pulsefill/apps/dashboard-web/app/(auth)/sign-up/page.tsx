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
          title="Create your PulseFill workspace."
          body="Set up the operating layer between cancellations and recovered bookings."
          bullets={["Team access", "Recovery workflow", "Revenue visibility"]}
          showRecoveryStrip={false}
        />
      }
    >
      <AuthCard
        title="Create your account"
        description="Set up PulseFill and start turning recovery into a system."
        footer={
          <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 14, color: "var(--muted)" }}>
            <span>
              Already have an account? <Link href="/sign-in">Sign in</Link>
            </span>
            <span style={{ fontSize: 11, lineHeight: 1.45, color: "rgba(245,247,250,0.38)" }}>
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
          <SubmitButton pendingText="Creating account…">Create account</SubmitButton>
        </form>
      </AuthCard>
    </AuthShell>
  );
}
