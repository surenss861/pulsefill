"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useActionState } from "react";
import { signInAction, sendMagicLinkAction, type AuthFormState } from "@/app/actions/auth";
import { AuthShell } from "@/components/auth/auth-shell";
import { AuthBrandPanel } from "@/components/auth/auth-brand-panel";
import { AuthCard } from "@/components/auth/auth-card";
import { AuthField } from "@/components/auth/auth-field";
import { PasswordField } from "@/components/auth/password-field";
import { SubmitButton } from "@/components/auth/submit-button";
import { PageState } from "@/components/ui/page-state";

const initial: AuthFormState = {};

export function SignInClient() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/overview";
  const resetOk = searchParams.get("reset") === "success";

  const [signInState, signInFormAction] = useActionState(signInAction, initial);
  const [magicState, magicFormAction] = useActionState(sendMagicLinkAction, initial);

  return (
    <AuthShell
      variant="split"
      brandPanel={
        <AuthBrandPanel
          eyebrow="Appointment recovery operating system"
          title="Run recovery with clarity."
          body="Standby demand, operator action, and recovered revenue — in one controlled workflow."
          bullets={["Queue visibility", "Explainable actions", "Recovery signals live"]}
          showRecoveryStrip
        />
      }
    >
      <AuthCard
        overtitle="Operator access"
        title="Sign in"
        description="Access PulseFill and continue running recovery with clarity."
        footer={
          <div style={{ display: "flex", flexDirection: "column", gap: 14, fontSize: 14, color: "var(--muted)" }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "12px 20px", justifyContent: "space-between" }}>
              <Link href="/forgot-password">Forgot password</Link>
              <span>
                Don&apos;t have an account? <Link href="/sign-up">Create one</Link>
              </span>
            </div>
            <span style={{ fontSize: 12, color: "rgba(245,247,250,0.45)" }}>
              Internal: <Link href="/staff-login">Paste access token</Link>
            </span>
            <span style={{ fontSize: 11, lineHeight: 1.45, color: "rgba(245,247,250,0.38)", maxWidth: 400 }}>
              Protected operator access. Session activity may be monitored.
            </span>
          </div>
        }
      >
        {resetOk ? (
          <PageState variant="success" title="Password updated" description="Sign in with your new password." />
        ) : null}

        <form action={signInFormAction} style={{ display: "grid", gap: 20 }}>
          <input type="hidden" name="next" value={next} />
          <AuthField label="Work email" name="email" type="email" placeholder="name@clinic.com" autoComplete="email" required />
          <PasswordField label="Password" name="password" placeholder="Enter your password" autoComplete="current-password" />
          {signInState.error ? <PageState variant="error" title="Sign-in failed" description={signInState.error} /> : null}
          <SubmitButton pendingText="Signing in…">Sign in</SubmitButton>
        </form>

        <div style={{ position: "relative", marginTop: 4 }}>
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center" }}>
            <div style={{ width: "100%", borderTop: "1px solid rgba(255,255,255,0.08)" }} />
          </div>
          <div style={{ position: "relative", display: "flex", justifyContent: "center" }}>
            <span
              style={{
                padding: "0 12px",
                fontSize: 11,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.22em",
                color: "rgba(245,247,250,0.35)",
                background: "rgba(8,10,16,0.85)",
              }}
            >
              Or
            </span>
          </div>
        </div>

        <form action={magicFormAction} style={{ display: "grid", gap: 16 }}>
          <AuthField label="Work email" name="email" type="email" placeholder="name@clinic.com" autoComplete="email" required />
          {magicState.error ? <PageState variant="error" title="Magic link failed" description={magicState.error} /> : null}
          <button
            type="submit"
            style={{
              display: "inline-flex",
              width: "100%",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 16,
              border: "1px solid rgba(255,255,255,0.1)",
              padding: "14px 18px",
              fontSize: 14,
              fontWeight: 600,
              color: "rgba(245,247,250,0.88)",
              background: "rgba(255,255,255,0.03)",
              cursor: "pointer",
            }}
          >
            Email me a magic link
          </button>
        </form>
      </AuthCard>
    </AuthShell>
  );
}
