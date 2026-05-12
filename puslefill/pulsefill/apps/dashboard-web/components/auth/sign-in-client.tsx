"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useActionState } from "react";
import { signInAction, sendMagicLinkAction, type AuthFormState } from "@/app/actions/auth";
import { AuthSignInPreview } from "@/components/auth/auth-sign-in-preview";
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
    <main className="pf-auth-shell">
      <div className="pf-auth-split">
        <div className="pf-auth-shell-enter">
          <Link href="/" className="pf-auth-brand">
            PulseFill
          </Link>
          <h1 className="pf-auth-lede">Sign in to run today&apos;s recovery.</h1>
          <p className="pf-auth-sub">Manage openings, claims, and confirmed bookings from one calm workspace.</p>
          <ul className="pf-auth-benefits">
            <li>See cancelled appointments</li>
            <li>Send offers to waiting customers</li>
            <li>Confirm claimed bookings</li>
          </ul>
          <div className="pf-auth-preview-wrap">
            <AuthSignInPreview />
          </div>
        </div>

        <div className="pf-auth-card pf-auth-shell-enter">
          {resetOk ? (
            <div style={{ marginBottom: 18 }}>
              <PageState variant="success" title="Password updated" description="Sign in with your new password." />
            </div>
          ) : null}

          <p className="pf-auth-card-eyebrow">Staff access</p>
          <h2 className="pf-auth-card-title">Sign in</h2>
          <p className="pf-auth-card-lede">Access your PulseFill workspace and keep recovery moving.</p>

          <form action={signInFormAction} style={{ display: "grid", gap: 0 }}>
            <input type="hidden" name="next" value={next} />
            <AuthField label="Email" name="email" type="email" placeholder="you@clinic.com" autoComplete="email" required />
            <PasswordField label="Password" name="password" placeholder="••••••••" autoComplete="current-password" />
            {signInState.error ? (
              <div style={{ marginTop: 12 }}>
                <PageState variant="error" title="Sign-in failed" description={signInState.error} />
              </div>
            ) : null}
            <div style={{ marginTop: 8 }}>
              <SubmitButton pendingText="Signing in…">Sign in</SubmitButton>
            </div>
          </form>

          <div
            style={{
              marginTop: 22,
              paddingTop: 18,
              borderTop: "1px solid var(--pf-brand-border-warm)",
            }}
          >
            <form action={magicFormAction} style={{ display: "grid", gap: 0 }}>
              <AuthField label="Email" name="email" type="email" placeholder="you@clinic.com" autoComplete="email" required />
              {magicState.error ? (
                <div style={{ marginTop: 12 }}>
                  <PageState variant="error" title="Magic link failed" description={magicState.error} />
                </div>
              ) : null}
              <button type="submit" className="pf-auth-magic-link">
                Email me a sign-in link
              </button>
            </form>
          </div>

          <div className="pf-auth-footer">
            <Link href="/forgot-password">Forgot password</Link>
            <span style={{ color: "var(--pf-text-muted)", fontWeight: 500 }}>
              Need an account? <Link href="/sign-up">Create one</Link>
            </span>
          </div>

          <p className="pf-auth-reassure">Protected access for your business workspace.</p>

          <p style={{ margin: "14px 0 0", fontSize: 12, lineHeight: 1.45, color: "var(--pf-text-muted)" }}>
            <Link href="/staff-login" style={{ fontWeight: 600 }}>
              Paste access token
            </Link>
            <span style={{ fontWeight: 500, opacity: 0.85 }}> — internal staff</span>
          </p>
        </div>
      </div>
    </main>
  );
}
