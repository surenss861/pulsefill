import type { OutcomesPageData } from "@/lib/outcomes-page-data";
import type { RecoveryInsightsData } from "@/lib/recovery-insights-data";
import { OperatorPageTransition } from "@/components/operator/operator-page-transition";
import { OutcomesActionStrip } from "./outcomes-action-strip";
import { OutcomesHero } from "./outcomes-hero";
import { OutcomesLearningPanel } from "./outcomes-learning-panel";
import { OutcomesLeakPanel } from "./outcomes-leak-panel";
import { OutcomesMixPanel } from "./outcomes-mix-panel";
import { OutcomesPerformanceTable } from "./outcomes-performance-table";
import { OutcomesRecentList } from "./outcomes-recent-list";
import { OutcomesScorecardRow } from "./outcomes-scorecard-row";

export type OutcomesPageContentProps = {
  data: OutcomesPageData;
  insights: RecoveryInsightsData | null;
  insightsError: string | null;
  onInsightsRetry: () => void;
};

export function OutcomesPageContent({ data, insights, insightsError, onInsightsRetry }: OutcomesPageContentProps) {
  return (
    <main className="pf-page-outcomes" style={{ padding: 0 }}>
      <OperatorPageTransition>
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <OutcomesHero windowLabel={data.windowLabel} />
        <OutcomesScorecardRow scorecards={data.scorecards} />

        {insights ? (
          <OutcomesLearningPanel data={insights} />
        ) : insightsError ? (
          <p className="pf-muted-copy" style={{ margin: 0, fontSize: 13 }}>
            {insightsError}{" "}
            <button
              type="button"
              onClick={onInsightsRetry}
              style={{
                border: "none",
                background: "transparent",
                color: "var(--primary)",
                cursor: "pointer",
                fontWeight: 600,
                fontSize: 13,
              }}
            >
              Retry
            </button>
          </p>
        ) : null}

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 24,
            alignItems: "stretch",
          }}
        >
          <OutcomesMixPanel outcomeMix={data.outcomeMix} />
          <OutcomesLeakPanel leaks={data.leaks} />
        </div>

        <OutcomesPerformanceTable rows={data.performanceRows} />

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 24,
            alignItems: "stretch",
          }}
        >
          <OutcomesRecentList
            title="Recently recovered"
            body="Openings successfully pulled back into the schedule."
            items={data.recentRecovered}
            emphasis="primary"
          />
          <OutcomesRecentList
            title="Recently lost"
            body="Openings that failed to recover or closed without resolution."
            items={data.recentLost}
            emphasis="danger"
          />
        </div>

        <OutcomesActionStrip />
      </div>
      </OperatorPageTransition>
    </main>
  );
}
