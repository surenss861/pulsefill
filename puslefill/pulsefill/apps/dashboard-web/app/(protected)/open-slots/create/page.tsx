"use client";

import Link from "next/link";
import { useState } from "react";
import type { OpenSlotCreatedSummary } from "@/components/slots/open-slot-created-summary";
import { OpenSlotCreatedPanel } from "@/components/slots/open-slot-created-panel";
import { OpenSlotForm } from "@/components/slots/open-slot-form";

export default function CreateOpenSlotPage() {
  const [created, setCreated] = useState<OpenSlotCreatedSummary | null>(null);

  return (
    <main style={{ padding: 24, maxWidth: 640 }}>
      <p style={{ marginTop: 0 }}>
        <Link href="/open-slots" style={{ fontSize: 14, color: "var(--primary)" }}>
          ← Open slots
        </Link>
      </p>

      <h1 style={{ margin: "16px 0 0", fontSize: 28, fontWeight: 650 }}>Create open slot</h1>
      <p style={{ color: "var(--muted)", marginTop: 8, lineHeight: 1.5, maxWidth: 560 }}>
        When a cancellation happens, add the opening here. Then send offers to standby customers from the next screen
        or the slot detail page.
      </p>

      {created ? (
        <OpenSlotCreatedPanel summary={created} onCreateAnother={() => setCreated(null)} />
      ) : (
        <OpenSlotForm onCreated={setCreated} />
      )}
    </main>
  );
}
