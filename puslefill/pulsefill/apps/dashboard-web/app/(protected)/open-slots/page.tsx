import { Suspense } from "react";
import { requireCurrentUser } from "@/lib/get-current-user";
import OpenSlotsPageClient from "./open-slots-page-client";

export default async function OpenSlotsPage() {
  await requireCurrentUser();

  return (
    <Suspense
      fallback={
        <main className="pf-page-openings pf-desk-page" style={{ padding: "0 0 24px" }}>
          <p style={{ color: "var(--muted)" }}>Loading openings…</p>
        </main>
      }
    >
      <OpenSlotsPageClient />
    </Suspense>
  );
}
