"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signInStaff } from "@/lib/auth";
import { setStaffAccessToken } from "@/lib/api";
import { AuthShell } from "@/components/auth/auth-shell";
import { AuthBrandPanel } from "@/components/auth/auth-brand-panel";
import { AuthCard } from "@/components/auth/auth-card";
import { AuthField } from "@/components/auth/auth-field";

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

  return (
    <AuthShell
      variant="split"
      brandPanel={
        <AuthBrandPanel
          eyebrow="Staff & developer access"
          title="Sign in for API tooling."
          body="Use the same Supabase account your API accepts as staff. Optional: paste a JWT for local client-side API calls."
          bullets={["Supabase session to open the app", "Bearer JWT optional for dev"]}
          recoveryActiveStep="confirmed"
          showRecoveryPipeline
        />
      }
    >
      <AuthCard
        overtitle="Staff"
        title="Staff sign in"
        description="Sign in with the same Supabase account your API accepts as staff (bearer JWT)."
        footer={
          <p style={{ margin: 0, fontSize: 12, color: "rgba(111,104,97,0.95)", lineHeight: 1.5 }}>
            Prefer the operator sign-in experience? <a href="/sign-in">Open /sign-in</a>. Configure{" "}
            <code>NEXT_PUBLIC_SUPABASE_URL</code> and <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> in <code>.env.local</code>. Pasted
            JWTs are for local API tooling only; the dashboard requires a Supabase session.
          </p>
        }
      >
        <p style={{ margin: "0 0 8px" }}>
          <button
            type="button"
            onClick={() => {
              setLegacyMode(!legacyMode);
              setError(null);
              setTokenSaved(false);
            }}
            style={{
              background: "none",
              border: "none",
              color: "var(--primary)",
              cursor: "pointer",
              textDecoration: "underline",
              fontSize: 13,
              padding: 0,
            }}
          >
            {legacyMode ? "Use email & password" : "Internal: paste JWT instead"}
          </button>
        </p>

        {legacyMode ? (
          <div style={{ display: "grid", gap: 12, marginBottom: 8 }}>
            {tokenSaved ? (
              <p style={{ margin: 0, fontSize: 13, color: "rgba(254, 215, 170, 0.92)" }}>
                Token saved for this browser. Use email and password to open the dashboard.
              </p>
            ) : null}
            <textarea
              value={legacyToken}
              onChange={(e) => setLegacyToken(e.target.value)}
              placeholder="Bearer JWT…"
              rows={4}
              style={{
                padding: 12,
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.12)",
                background: "linear-gradient(180deg, rgba(255,255,255,0.05), rgba(0,0,0,0.2)), #12110f",
                color: "var(--text)",
                fontFamily: "ui-monospace, monospace",
                fontSize: 12,
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
              }}
            />
            <button
              type="button"
              onClick={() => {
                setStaffAccessToken(legacyToken.trim() || null);
                setError(null);
                setTokenSaved(true);
              }}
              style={{
                padding: "12px 16px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(255,255,255,0.04)",
                color: "var(--text)",
                cursor: "pointer",
              }}
            >
              Save token for API requests
            </button>
            <p style={{ margin: 0, fontSize: 12, color: "var(--muted)", lineHeight: 1.5 }}>
              Token is stored in this browser for client-side API calls. To open the app shell, use email and password above (same
              Supabase account), then go to <a href="/overview">/overview</a>.
            </p>
          </div>
        ) : null}

        <form onSubmit={(e) => void onSubmit(e)} style={{ display: "grid", gap: 16 }}>
          <AuthField
            label="Email"
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
          <AuthField
            label="Password"
            name="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />

          {error ? <p style={{ margin: 0, fontSize: 14, color: "#f87171" }}>{error}</p> : null}

          <button
            type="submit"
            disabled={loading || legacyMode}
            style={{
              display: "inline-flex",
              width: "100%",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 16,
              border: "none",
              padding: "16px 20px",
              minHeight: 52,
              fontSize: 14,
              fontWeight: 650,
              color: "var(--pf-btn-primary-text)",
              background: "var(--pf-btn-primary-bg)",
              boxShadow: "var(--pf-btn-primary-shadow)",
              cursor: loading || legacyMode ? "not-allowed" : "pointer",
              opacity: loading || legacyMode ? 0.65 : 1,
            }}
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </AuthCard>
    </AuthShell>
  );
}
