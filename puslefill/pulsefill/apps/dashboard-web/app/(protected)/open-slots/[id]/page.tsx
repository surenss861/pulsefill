import { Suspense } from "react";
import { OpenSlotDetailPage } from "@/components/open-slot-detail/open-slot-detail-page";

export default function OpenSlotDetailRoutePage() {
  return (
    <Suspense
      fallback={
        <main style={{ padding: 24, maxWidth: 920 }}>
          <p style={{ color: "var(--muted)" }}>Loading opening…</p>
        </main>
      }
    >
      <OpenSlotDetailPage />
    </Suspense>
  );
}
