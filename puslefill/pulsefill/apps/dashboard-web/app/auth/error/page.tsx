import Link from "next/link";

export default function AuthErrorPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        background: "var(--pf-bg-app)",
        color: "var(--text)",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 480,
          borderRadius: 24,
          border: "1px solid rgba(255,255,255,0.1)",
          background: "rgba(255,255,255,0.03)",
          padding: 32,
        }}
      >
        <p style={{ margin: 0, fontSize: 12, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--muted)" }}>
          Auth error
        </p>
        <h1 style={{ margin: "16px 0 0", fontSize: 32, fontWeight: 620, letterSpacing: "-0.04em", lineHeight: 1.1 }}>
          This link is invalid or expired.
        </h1>
        <p style={{ margin: "16px 0 0", color: "var(--muted)", lineHeight: 1.55, fontSize: 14 }}>
          Request a fresh sign-in or reset link and try again.
        </p>
        <div style={{ marginTop: 28 }}>
          <Link
            href="/sign-in"
            style={{
              display: "inline-flex",
              borderRadius: 16,
              padding: "12px 20px",
              fontSize: 14,
              fontWeight: 650,
              background: "var(--pf-accent-primary)",
              color: "var(--pf-btn-primary-text)",
              boxShadow: "var(--pf-btn-primary-shadow)",
            }}
          >
            Back to sign in
          </Link>
        </div>
      </div>
    </main>
  );
}
