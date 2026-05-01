"use client";

import Link from "next/link";
import { useState } from "react";
import type { OpenSlotCreatedSummary } from "@/components/slots/open-slot-created-summary";
import { OpenSlotCreatedPanel } from "@/components/slots/open-slot-created-panel";
import { OpenSlotForm } from "@/components/slots/open-slot-form";
import { PageCommandHeader } from "@/components/operator/page-command-header";
import { OperatorPageTransition } from "@/components/operator/operator-page-transition";
import { MotionAction } from "@/components/operator/operator-motion-primitives";
import { actionLinkStyle } from "@/lib/operator-action-link-styles";

export default function CreateOpenSlotPage() {
  const [created, setCreated] = useState<OpenSlotCreatedSummary | null>(null);

  return (
    <main className="pf-page-open-slot-create" style={{ padding: "clamp(16px, 3vw, 24px) 0 32px" }}>
      <PageCommandHeader
        animate={false}
        tone="default"
        eyebrow="Opening intake"
        title="Create opening"
        description="Capture a cancelled appointment time so PulseFill can match standby customers."
        secondaryAction={
          <MotionAction>
            <Link href="/open-slots" style={actionLinkStyle("secondary")}>
              ← Openings
            </Link>
          </MotionAction>
        }
        style={{ marginBottom: 20 }}
      />

      <OperatorPageTransition>
        {created ? (
          <OpenSlotCreatedPanel summary={created} onCreateAnother={() => setCreated(null)} />
        ) : (
          <OpenSlotForm onCreated={setCreated} />
        )}
      </OperatorPageTransition>
    </main>
  );
}
