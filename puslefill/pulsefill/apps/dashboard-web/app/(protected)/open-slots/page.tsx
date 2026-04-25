import { Suspense } from "react";
import { OpenSlotsInventoryHero } from "@/components/open-slots/open-slots-inventory-hero";
import { requireCurrentUser } from "@/lib/get-current-user";
import OpenSlotsPageClient from "./open-slots-page-client";

export default async function OpenSlotsPage() {
  await requireCurrentUser();

  return (
    <>
      <OpenSlotsInventoryHero />
      <Suspense
        fallback={
          <main style={{ padding: "0 0 24px" }}>
            <p style={{ color: "var(--muted)" }}>Loading open slots…</p>
          </main>
        }
      >
        <OpenSlotsPageClient />
      </Suspense>
    </>
  );
}
