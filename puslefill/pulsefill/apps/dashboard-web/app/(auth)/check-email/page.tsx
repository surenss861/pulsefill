import Link from "next/link";
import { AuthWarmCard } from "@/components/auth/auth-warm-card";
import { AUTH_RECOVERY_BENEFITS, AuthWarmSplit } from "@/components/auth/auth-warm-split";
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
    <AuthWarmSplit
      headline="Almost there."
      subhead="We sent a secure link so we know this inbox belongs to your team. Verification keeps your workspace private."
      benefits={AUTH_RECOVERY_BENEFITS}
      showCasePreview
    >
      <AuthWarmCard
        eyebrow="Verify email"
        title="Check your inbox"
        lede={`We sent a secure link to ${displayEmail}. Open the message and follow the steps to continue.`}
        footer={
          <div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "flex-start" }}>
            <Link href="/sign-in">Back to sign in</Link>
            <CheckEmailResend email={email} flow={flow} />
          </div>
        }
      >
        <p className="pf-auth-inset-note" style={{ marginTop: 0 }}>
          Didn&apos;t get it? Check spam, promotions, or filtered folders first.
        </p>
        <Link href="/sign-in" className="pf-auth-outline-button">
          Return to sign in
        </Link>
      </AuthWarmCard>
    </AuthWarmSplit>
  );
}
