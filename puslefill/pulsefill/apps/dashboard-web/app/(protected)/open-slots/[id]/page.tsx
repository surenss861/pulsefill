import { Suspense } from "react";
import { OpenSlotDetailPage } from "@/components/open-slot-detail/open-slot-detail-page";

export default function OpenSlotDetailRoutePage() {
  return (
    <Suspense
      fallback={
        <main className="pf-page-slot-detail" style={{ padding: 24 }}>
          <p className="pf-muted-copy">Loading opening…</p>
        </main>
      }
    >
      <OpenSlotDetailPage />
    </Suspense>
  );
}
