import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { AuthBrandPanel } from "@/components/auth/auth-brand-panel";
import { AuthCard } from "@/components/auth/auth-card";
import { actionLinkStyle } from "@/lib/operator-action-link-styles";

export default function NotFound() {
  return (
    <AuthShell
      variant="split"
      brandPanel={
        <AuthBrandPanel
          eyebrow="PulseFill"
          title="That route does not exist."
          body="Operators move through openings, claims, and recovery — this URL is not part of the workspace map."
          bullets={["Check the link you pasted", "Use the sidebar after you sign in"]}
          showRecoveryPipeline
        />
      }
    >
      <AuthCard
        overtitle="404"
        title="Page not found"
        description="The page you requested is not available. It may have moved, or the link may be mistyped."
        footer={
          <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 14 }}>
            <Link href="/sign-in" style={actionLinkStyle("primary")}>
              Sign in
            </Link>
            <Link href="/" style={{ ...actionLinkStyle("secondary"), fontSize: 13 }}>
              Back to home
            </Link>
          </div>
        }
      >
        {null}
      </AuthCard>
    </AuthShell>
  );
}
