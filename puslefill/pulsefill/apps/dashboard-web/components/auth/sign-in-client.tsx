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
          body="Standby demand, operator action, and recovered revenue — connected in one controlled workflow."
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
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "10px 18px",
                justifyContent: "space-between",
                fontSize: 13,
                color: "rgba(245,247,250,0.42)",
              }}
            >
              <Link href="/forgot-password" style={{ color: "rgba(245,247,250,0.48)", fontWeight: 500 }}>
                Forgot password
              </Link>
              <span style={{ color: "rgba(245,247,250,0.42)" }}>
                Don&apos;t have an account?{" "}
                <Link href="/sign-up" style={{ color: "rgba(253, 186, 116, 0.75)", fontWeight: 600 }}>
                  Create one
                </Link>
              </span>
            </div>
            <div style={{ fontSize: 11, lineHeight: 1.4, color: "rgba(245,247,250,0.28)" }}>
              <span style={{ color: "rgba(245,247,250,0.26)" }}>Internal — </span>
              <Link href="/staff-login" style={{ color: "rgba(245,247,250,0.36)", fontWeight: 500 }}>
                Paste access token
              </Link>
            </div>
            <span style={{ fontSize: 11, lineHeight: 1.45, color: "rgba(245,247,250,0.34)", maxWidth: 400 }}>
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

        <div style={{ marginTop: 10 }}>
          <div style={{ position: "relative", marginBottom: 2 }}>
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center" }}>
              <div style={{ width: "100%", borderTop: "1px solid rgba(255,255,255,0.05)" }} />
            </div>
            <div style={{ position: "relative", display: "flex", justifyContent: "center" }}>
              <span
                style={{
                  padding: "0 10px",
                  fontSize: 10,
                  fontWeight: 650,
                  textTransform: "uppercase",
                  letterSpacing: "0.2em",
                  color: "rgba(245,247,250,0.28)",
                  background: "rgba(10,12,18,0.92)",
                }}
              >
                Or
              </span>
            </div>
          </div>

          <form action={magicFormAction} style={{ display: "grid", gap: 10 }}>
            <AuthField label="Work email" name="email" type="email" placeholder="name@clinic.com" autoComplete="email" required />
            {magicState.error ? <PageState variant="error" title="Magic link failed" description={magicState.error} /> : null}
            <button
              type="submit"
              style={{
                display: "inline-flex",
                width: "100%",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 14,
                border: "1px solid rgba(255,255,255,0.07)",
                padding: "11px 16px",
                fontSize: 13,
                fontWeight: 500,
                color: "rgba(245,247,250,0.58)",
                background: "rgba(255,255,255,0.02)",
                cursor: "pointer",
              }}
            >
              Email me a magic link
            </button>
          </form>
        </div>
      </AuthCard>
    </AuthShell>
  );
}
