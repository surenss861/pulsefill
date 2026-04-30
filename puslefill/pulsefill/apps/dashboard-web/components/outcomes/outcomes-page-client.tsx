"use client";

import { OutcomesPageContent } from "@/components/outcomes/outcomes-page-content";
import { ActionButton } from "@/components/ui/action-button";
import { PageState } from "@/components/ui/page-state";
import { useOutcomesPage } from "@/hooks/useOutcomesPage";

export function OutcomesPageClient() {
  const { data, loading, error, reload } = useOutcomesPage();

  if (error) {
    return (
      <main className="pf-page-outcomes" style={{ padding: 0 }}>
        <PageState
          variant="error"
          title="Could not load outcomes"
          description={error}
          style={{ maxWidth: 560 }}
        />
        <div style={{ marginTop: 16 }}>
          <ActionButton variant="primary" onClick={() => void reload()}>
            Try again
          </ActionButton>
        </div>
      </main>
    );
  }

  if (loading || !data) {
    return (
      <main className="pf-page-outcomes" style={{ padding: 0 }}>
        <PageState variant="info" title="Loading outcomes" description="Pulling recovery proof from your workspace." />
      </main>
    );
  }

  return <OutcomesPageContent data={data} />;
}
