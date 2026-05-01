import { Suspense } from "react";
import { OpenSlotDetailPage } from "@/components/open-slot-detail/open-slot-detail-page";
import { OperatorLoadingState } from "@/components/operator/operator-loading-state";

export default function OpenSlotDetailRoutePage() {
  return (
    <Suspense
      fallback={
        <main className="pf-page-slot-detail" style={{ padding: 24 }}>
          <OperatorLoadingState
            variant="section"
            skeleton="form"
            title="Loading opening…"
            description="Preparing the case file and recovery workspace."
          />
        </main>
      }
    >
      <OpenSlotDetailPage />
    </Suspense>
  );
}
