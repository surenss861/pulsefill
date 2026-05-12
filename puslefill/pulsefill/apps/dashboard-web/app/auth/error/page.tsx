import Link from "next/link";
import { AuthWarmCard } from "@/components/auth/auth-warm-card";
import { AuthWarmSplit } from "@/components/auth/auth-warm-split";
import { authMorphLinkProps } from "@/lib/auth-morph-nav";

type Props = {
  searchParams: Promise<{ reason?: string }>;
};

export default async function AuthErrorPage({ searchParams }: Props) {
  const { reason } = await searchParams;
  const profileMissing = reason === "profile";

  const title = profileMissing ? "Your account profile is not ready yet." : "This link is invalid or expired.";
  const description = profileMissing
    ? "You are signed in, but we could not load your PulseFill profile. Try signing out and back in, or contact support if this persists."
    : "Request a fresh sign-in or reset link from the sign-in page and try again.";

  return (
    <AuthWarmSplit
      headline={"We couldn't complete that sign-in."}
      subhead="Expired links, missing setup, or incomplete profiles stop here — so your workspace stays gated."
      benefits={[]}
      showCasePreview={false}
    >
      <AuthWarmCard eyebrow="Auth" title={title} lede={description}>
        <p className="pf-auth-inset-note" style={{ marginTop: 0 }}>
          If you followed a link from email, request a new one from the sign-in page. For profile issues, sign out completely, then sign in again.
        </p>
        <div className="pf-auth-footer" style={{ marginTop: 20, paddingTop: 18, borderTop: "1px solid var(--pf-brand-border-warm)" }}>
          <Link href="/sign-in" {...authMorphLinkProps("/sign-in")}>
            Back to sign in
          </Link>
          <Link href="/forgot-password">Forgot password</Link>
        </div>
      </AuthWarmCard>
    </AuthWarmSplit>
  );
}
