import { Suspense } from "react";
import { ActivityPageClient } from "@/components/activity/activity-page-client";
import { requireCurrentUser } from "@/lib/get-current-user";

export default async function ActivityPage() {
  await requireCurrentUser();

  return (
    <Suspense
      fallback={
        <main style={{ padding: 0, maxWidth: 1080 }}>
          <p style={{ color: "rgba(245, 247, 250, 0.45)", margin: 0, fontSize: 14 }}>Loading activity…</p>
        </main>
      }
    >
      <ActivityPageClient />
    </Suspense>
  );
}
