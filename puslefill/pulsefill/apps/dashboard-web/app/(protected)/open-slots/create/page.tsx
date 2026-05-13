"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useBillingSummary } from "@/hooks/useBillingSummary";
import type { OpenSlotCreatedSummary } from "@/components/slots/open-slot-created-summary";
import { OpenSlotCreatedPanel } from "@/components/slots/open-slot-created-panel";
import { OpenSlotForm } from "@/components/slots/open-slot-form";
import { BillingInlineGuardrail } from "@/components/billing/billing-inline-guardrail";
import { DeskPageHeader } from "@/components/dashboard/desk/desk-page-header";
import { OperatorLoadingState } from "@/components/operator/operator-loading-state";
import { OperatorPageTransition } from "@/components/operator/operator-page-transition";

export default function CreateOpenSlotPage() {
  const [created, setCreated] = useState<OpenSlotCreatedSummary | null>(null);
  const billingSummary = useBillingSummary();

  const headerActions = (
    <Link href="/open-slots" prefetch={false} className="pf-desk-quiet-link" style={{ marginTop: 0 }}>
      Back to openings
    </Link>
  );

  return (
    <main className="pf-page-open-slot-create pf-desk-page" style={{ padding: 0 }}>
      <OperatorPageTransition>
        <div className="pf-overview-desk-stack">
          <DeskPageHeader
            title="Create opening"
            subtitle="Add the cancelled appointment time so PulseFill can find matching customers on your waitlist."
            actions={headerActions}
          />

          {created ? (
            <OpenSlotCreatedPanel summary={created} onCreateAnother={() => setCreated(null)} />
          ) : (
            <>
              {!billingSummary.loading && billingSummary.data ? (
                <div>
                  <BillingInlineGuardrail summary={billingSummary.data} />
                </div>
              ) : null}
              <Suspense
                fallback={
                  <OperatorLoadingState variant="section" skeleton="form" title="Loading form…" description="Reading link preferences." />
                }
              >
                <OpenSlotForm onCreated={setCreated} />
              </Suspense>
            </>
          )}
        </div>
      </OperatorPageTransition>
    </main>
  );
}
