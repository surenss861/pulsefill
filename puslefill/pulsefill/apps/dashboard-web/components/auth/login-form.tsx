"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signInStaff } from "@/lib/auth";
import { setStaffAccessToken } from "@/lib/api";

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
    <main style={{ padding: 40, maxWidth: 480, margin: "0 auto" }}>
      <h1 style={{ marginTop: 0 }}>Staff sign in</h1>
      <p style={{ color: "var(--muted)", marginBottom: 24 }}>
        Sign in with the same Supabase account your API accepts as staff (bearer JWT).
      </p>

      <p style={{ marginBottom: 16 }}>
        <button
          type="button"
          onClick={() => {
            setLegacyMode(!legacyMode);
            setError(null);
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
        <div style={{ display: "grid", gap: 12, marginBottom: 24 }}>
          <textarea
            value={legacyToken}
            onChange={(e) => setLegacyToken(e.target.value)}
            placeholder="Bearer JWT…"
            rows={4}
            style={{
              padding: 12,
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.15)",
              background: "var(--surface)",
              color: "var(--text)",
              fontFamily: "ui-monospace, monospace",
              fontSize: 12,
            }}
          />
          <button
            type="button"
            onClick={() => {
              setStaffAccessToken(legacyToken.trim() || null);
              router.push(next);
            }}
            style={{
              padding: "12px 16px",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.2)",
              background: "rgba(255,255,255,0.06)",
              color: "var(--text)",
              cursor: "pointer",
            }}
          >
            Continue with pasted token
          </button>
        </div>
      ) : null}

      <form onSubmit={(e) => void onSubmit(e)} style={{ display: "grid", gap: 16 }}>
        <label style={{ display: "grid", gap: 8 }}>
          <span style={{ fontSize: 13, color: "var(--muted)" }}>Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            style={{
              padding: "12px 14px",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.15)",
              background: "var(--surface)",
              color: "var(--text)",
            }}
          />
        </label>
        <label style={{ display: "grid", gap: 8 }}>
          <span style={{ fontSize: 13, color: "var(--muted)" }}>Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            style={{
              padding: "12px 14px",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.15)",
              background: "var(--surface)",
              color: "var(--text)",
            }}
          />
        </label>

        {error ? (
          <p style={{ margin: 0, fontSize: 14, color: "#f87171" }}>{error}</p>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "14px 20px",
            borderRadius: 14,
            border: "none",
            background: "var(--primary)",
            color: "#0a0c10",
            fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>

      {!legacyMode ? (
        <p style={{ marginTop: 24, fontSize: 12, color: "var(--muted)" }}>
          Configure <code>NEXT_PUBLIC_SUPABASE_URL</code> and <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> in{" "}
          <code>.env.local</code>, or use the legacy JWT option above.
        </p>
      ) : null}
    </main>
  );
}
