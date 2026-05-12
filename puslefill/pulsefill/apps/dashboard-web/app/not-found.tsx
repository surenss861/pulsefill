import Link from "next/link";
import { AuthWarmCard } from "@/components/auth/auth-warm-card";
import { AuthWarmSplit } from "@/components/auth/auth-warm-split";
import { authMorphLinkProps } from "@/lib/auth-morph-nav";

export default function NotFound() {
  return (
    <AuthWarmSplit
      headline={"This page isn't here."}
      subhead="The URL may be mistyped, or the page moved. Head back to PulseFill home or staff sign-in."
      benefits={["Confirm the link from your team", "Use the app navigation after you sign in"]}
      showCasePreview={false}
    >
      <AuthWarmCard eyebrow="404" title="Page not found" lede="The page you requested is not available.">
        <div className="pf-auth-footer" style={{ marginTop: 16, paddingTop: 0, borderTop: "none" }}>
          <Link href="/sign-in" {...authMorphLinkProps("/sign-in")}>
            Sign in
          </Link>
          <Link href="/">Back to home</Link>
        </div>
      </AuthWarmCard>
    </AuthWarmSplit>
  );
}
