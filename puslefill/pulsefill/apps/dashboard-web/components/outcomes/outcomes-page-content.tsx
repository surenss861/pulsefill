import type { OutcomesPageData } from "@/lib/outcomes-page-data";
import { OutcomesActionStrip } from "./outcomes-action-strip";
import { OutcomesHero } from "./outcomes-hero";
import { OutcomesLeakPanel } from "./outcomes-leak-panel";
import { OutcomesMixPanel } from "./outcomes-mix-panel";
import { OutcomesPerformanceTable } from "./outcomes-performance-table";
import { OutcomesRecentList } from "./outcomes-recent-list";
import { OutcomesScorecardRow } from "./outcomes-scorecard-row";

export type OutcomesPageContentProps = {
  data: OutcomesPageData;
};

export function OutcomesPageContent({ data }: OutcomesPageContentProps) {
  return (
    <main className="pf-page-outcomes" style={{ padding: 0 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <OutcomesHero windowLabel={data.windowLabel} />
        <OutcomesScorecardRow scorecards={data.scorecards} />

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
    </main>
  );
}
