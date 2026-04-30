import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { AuthBrandPanel } from "@/components/auth/auth-brand-panel";
import { AuthCard } from "@/components/auth/auth-card";
import { actionLinkStyle } from "@/lib/operator-action-link-styles";

type Props = {
  searchParams: Promise<{ reason?: string }>;
};

export default async function AuthErrorPage({ searchParams }: Props) {
  const { reason } = await searchParams;
  const profileMissing = reason === "profile";

  const title = profileMissing ? "Your account profile is not ready yet." : "This link is invalid or expired.";
  const description = profileMissing
    ? "You are signed in, but we could not load your PulseFill profile. Try signing out and back in, or contact support if this persists."
    : "Request a fresh sign-in or reset link and try again.";

  return (
    <AuthShell
      variant="split"
      brandPanel={
        <AuthBrandPanel
          eyebrow="Secure access"
          title="Recovery pauses when trust breaks."
          body="Expired magic links, missing configuration, or incomplete profiles all stop here — so your operator workspace stays gated."
          bullets={[]}
          showRecoveryPipeline
        />
      }
    >
      <AuthCard
        overtitle="Auth error"
        title={title}
        description={description}
        footer={
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <Link href="/sign-in" style={actionLinkStyle("primary")}>
              Back to sign in
            </Link>
            <Link href="/forgot-password" style={{ ...actionLinkStyle("secondary"), fontSize: 13 }}>
              Forgot password
            </Link>
          </div>
        }
      >
        <div
          style={{
            borderRadius: 16,
            border: "1px solid rgba(255,255,255,0.07)",
            background: "linear-gradient(180deg, rgba(255,255,255,0.03), rgba(0,0,0,0.18))",
            padding: "14px 16px",
            fontSize: 13,
            lineHeight: 1.55,
            color: "rgba(245,242,237,0.55)",
          }}
        >
          If you followed a link from email, request a new one from the sign-in page. For profile issues, try signing out
          completely, then sign in again.
        </div>
      </AuthCard>
    </AuthShell>
  );
}
