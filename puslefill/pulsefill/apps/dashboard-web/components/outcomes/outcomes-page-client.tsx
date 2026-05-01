"use client";

import { OutcomesHero } from "@/components/outcomes/outcomes-hero";
import { OutcomesPageContent } from "@/components/outcomes/outcomes-page-content";
import { OperatorErrorState } from "@/components/operator/operator-error-state";
import { OperatorLoadingState } from "@/components/operator/operator-loading-state";
import { ActionButton } from "@/components/ui/action-button";
import { useOutcomesPage } from "@/hooks/useOutcomesPage";

export function OutcomesPageClient() {
  const { data, loading, error, reload } = useOutcomesPage();

  if (error) {
    return (
      <main className="pf-page-outcomes" style={{ padding: 0 }}>
        <OutcomesHero />
        <div style={{ marginTop: 12 }}>
          <OperatorErrorState
            rawMessage={error}
            primaryAction={<ActionButton onClick={() => void reload()}>Try again</ActionButton>}
          />
        </div>
      </main>
    );
  }

  if (loading || !data) {
    return (
      <main className="pf-page-outcomes" style={{ padding: 0 }}>
        <OutcomesHero />
        <div style={{ marginTop: 12 }}>
          <OperatorLoadingState variant="section" skeleton="cards" title="Loading outcomes…" />
        </div>
      </main>
    );
  }

  return <OutcomesPageContent data={data} />;
}
