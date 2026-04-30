import Link from "next/link";
import { PageCommandHeader } from "@/components/operator/page-command-header";
import { operatorSurfaceShell } from "@/lib/operator-surface-styles";

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
          <Link href="/settings" style={{ fontSize: 13, fontWeight: 600, color: "rgba(245,247,250,0.55)" }}>
            Account settings
          </Link>
        }
        style={{ marginBottom: 16 }}
      />
      <div style={{ padding: 18, ...operatorSurfaceShell("quiet") }}>
        <h2 className="pf-section-title" style={{ fontSize: 15 }}>
          Billing is not connected yet
        </h2>
        <p className="pf-muted-copy" style={{ margin: "8px 0 0" }}>
          Plan management and invoices will appear here when billing is enabled. Nothing is wrong with your account — this area stays quiet until the feature is available.
        </p>
      </div>
    </main>
  );
}
