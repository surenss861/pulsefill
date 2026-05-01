import Link from "next/link";
import { MotionAction } from "@/components/operator/operator-motion-primitives";
import { OperatorPageTransition } from "@/components/operator/operator-page-transition";
import { PageCommandHeader } from "@/components/operator/page-command-header";
import { OperatorListEmptyState } from "@/components/operator/operator-list-empty-state";
import { actionLinkStyle } from "@/lib/operator-action-link-styles";

export default function BillingPage() {
  return (
    <main className="pf-page-billing" style={{ padding: 0 }}>
      <PageCommandHeader
        animate={false}
        tone="default"
        eyebrow="Workspace"
        title="Billing"
        description="Manage your PulseFill plan, invoices, and billing details when billing is enabled for your workspace."
        secondaryAction={
          <MotionAction>
            <Link href="/settings" style={{ ...actionLinkStyle("ghost"), fontSize: 13 }}>
              Settings
            </Link>
          </MotionAction>
        }
        style={{ marginBottom: 16 }}
      />
      <OperatorPageTransition>
        <OperatorListEmptyState
          compact
          title="Billing is not active yet"
          description="Billing will appear here when payments are connected for this workspace. Nothing is wrong with your account — this area stays quiet until the feature is available."
          secondaryAction={
            <MotionAction>
              <Link href="/settings" style={actionLinkStyle("secondary")}>
                Open settings
              </Link>
            </MotionAction>
          }
        />
      </OperatorPageTransition>
    </main>
  );
}
