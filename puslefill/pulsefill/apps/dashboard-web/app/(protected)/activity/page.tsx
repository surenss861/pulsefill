import { Suspense } from "react";
import { ActivityPageClient } from "@/components/activity/activity-page-client";
import { requireCurrentUser } from "@/lib/get-current-user";

export default async function ActivityPage() {
  await requireCurrentUser();

  return (
    <Suspense
      fallback={
        <main className="pf-page-activity" style={{ padding: 0 }}>
          <p className="pf-muted-copy" style={{ margin: 0, fontSize: 14 }}>
            Loading activity…
          </p>
        </main>
      }
    >
      <ActivityPageClient />
    </Suspense>
  );
}
