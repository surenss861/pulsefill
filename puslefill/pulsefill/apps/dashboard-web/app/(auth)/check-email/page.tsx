import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { AuthBrandPanel } from "@/components/auth/auth-brand-panel";
import { AuthCard } from "@/components/auth/auth-card";
import { CheckEmailResend } from "@/components/auth/check-email-resend";

export default async function CheckEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; flow?: string }>;
}) {
  const sp = await searchParams;
  const email = sp.email ?? "";
  const flow = sp.flow ?? "signup";
  const displayEmail = email || "your inbox";

  return (
    <AuthShell
      variant="split"
      brandPanel={
        <AuthBrandPanel
          eyebrow="Verify identity"
          title="Check your inbox."
          body="PulseFill keeps operator workspaces gated. Email verification is the handshake before your team enters the OS."
          bullets={[]}
          recoveryActiveStep="matched"
          showRecoveryPipeline
        />
      }
    >
      <AuthCard
        title="Check your email"
        description={`We sent a secure link to ${displayEmail}. Open the message and follow the instructions.`}
        showMobileWordmark
        footer={
          <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 14, color: "var(--muted)" }}>
            <Link href="/sign-in">Back to sign in</Link>
            <CheckEmailResend email={email} flow={flow} />
          </div>
        }
      >
        <div
          style={{
            borderRadius: 16,
            border: "1px solid rgba(255,255,255,0.08)",
            background: "rgba(255,255,255,0.02)",
            padding: "14px 16px",
            fontSize: 14,
            lineHeight: 1.55,
            color: "rgba(245,242,237,0.78)",
          }}
        >
          Didn&apos;t get it? Check spam, promotions, or filtered folders first.
        </div>
        <Link
          href="/sign-in"
          style={{
            display: "inline-flex",
            width: "100%",
            boxSizing: "border-box",
            justifyContent: "center",
            borderRadius: 16,
            border: "1px solid rgba(255,255,255,0.1)",
            padding: "14px 18px",
            fontSize: 14,
            fontWeight: 600,
            color: "rgba(245,242,237,0.9)",
            background: "rgba(255,255,255,0.03)",
            textAlign: "center",
          }}
        >
          Return to sign in
        </Link>
      </AuthCard>
    </AuthShell>
  );
}
