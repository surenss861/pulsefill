"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signInStaff } from "@/lib/auth";
import { setStaffAccessToken } from "@/lib/api";
import { AuthWarmCard } from "@/components/auth/auth-warm-card";
import { AuthWarmSplit } from "@/components/auth/auth-warm-split";
import { AuthField } from "@/components/auth/auth-field";
import { PasswordField } from "@/components/auth/password-field";
import { AuthModeTransitionLink } from "@/components/auth/auth-mode-transition-link";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/overview";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [legacyToken, setLegacyToken] = useState("");
  const [legacyMode, setLegacyMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tokenSaved, setTokenSaved] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      await signInStaff(email, password);
      router.push(next);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sign in");
    } finally {
      setLoading(false);
    }
  }

  function saveToken() {
    setStaffAccessToken(legacyToken.trim() || null);
    setError(null);
    setTokenSaved(true);
  }

  return (
    <AuthWarmSplit
      headline={"Staff & API access."}
      subhead="Sign in with the Supabase account your environment treats as staff. Optional: paste a JWT for local API tooling in this browser only."
      benefits={["Same session the dashboard expects", "JWT is optional — for dev clients only"]}
      showCasePreview
    >
      <AuthWarmCard
        eyebrow="Internal"
        title="Staff sign in"
        lede="Use the same Supabase credentials your API accepts as staff. Configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY locally."
        footer={
          <p className="pf-auth-reassure" style={{ marginTop: 0 }}>
            Prefer the operator experience? <AuthModeTransitionLink href="/sign-in">Open staff sign in</AuthModeTransitionLink>.
          </p>
        }
      >
        <p style={{ margin: "0 0 4px" }}>
          <button
            type="button"
            className="pf-auth-magic-link"
            style={{ marginTop: 0, textAlign: "left", width: "auto", display: "inline" }}
            onClick={() => {
              setLegacyMode(!legacyMode);
              setError(null);
              setTokenSaved(false);
            }}
          >
            {legacyMode ? "Use email & password instead" : "Internal: paste JWT instead"}
          </button>
        </p>

        {legacyMode ? (
          <div style={{ display: "grid", gap: 12, marginBottom: 8 }}>
            {tokenSaved ? (
              <p className="pf-auth-inset-note" style={{ marginTop: 0 }}>
                Token saved for this browser. Use email and password to open the dashboard.
              </p>
            ) : null}
            <textarea
              value={legacyToken}
              onChange={(e) => setLegacyToken(e.target.value)}
              placeholder="Bearer JWT…"
              rows={4}
              className="pf-auth-textarea"
            />
            <button type="button" className="pf-auth-ghost-button" onClick={() => saveToken()}>
              Save token for API requests
            </button>
            <p className="pf-auth-inset-note" style={{ marginTop: 0 }}>
              Token is stored in this browser for client-side API calls. To open the app shell, sign in with email and password, then go to{" "}
              <Link href="/overview">overview</Link>.
            </p>
          </div>
        ) : null}

        <form onSubmit={(e) => void onSubmit(e)} style={{ display: "grid", gap: 0 }}>
          <AuthField label="Email" name="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
          <PasswordField
            label="Password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            placeholder="••••••••"
          />
          {error ? <div className="pf-auth-error-banner">{error}</div> : null}
          <button type="submit" disabled={loading || legacyMode} className="pf-auth-submit" style={{ marginTop: 12 }}>
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </AuthWarmCard>
    </AuthWarmSplit>
  );
}
