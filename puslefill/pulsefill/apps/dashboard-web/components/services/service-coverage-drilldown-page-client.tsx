"use client";

import Link from "next/link";
import { PageCommandHeader } from "@/components/operator/page-command-header";
import { MotionAction } from "@/components/operator/operator-motion-primitives";
import { OperatorErrorState } from "@/components/operator/operator-error-state";
import { OperatorLoadingState } from "@/components/operator/operator-loading-state";
import { OperatorPageTransition } from "@/components/operator/operator-page-transition";
import { SectionCard } from "@/components/ui/section-card";
import { ActionButton } from "@/components/ui/action-button";
import { useServiceCoverageDrilldown } from "@/hooks/useServiceCoverageDrilldown";
import { actionLinkStyle } from "@/lib/operator-action-link-styles";

function isUuidLike(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

type Props = {
  serviceId: string;
};

export function ServiceCoverageDrilldownPageClient({ serviceId }: Props) {
  const { data, loading, error, notFound, reload } = useServiceCoverageDrilldown(
    isUuidLike(serviceId) ? serviceId : undefined,
  );

  if (!isUuidLike(serviceId)) {
    return (
      <main className="pf-page-services" style={{ padding: 0 }}>
        <PageCommandHeader
          animate={false}
          tone="default"
          eyebrow="Coverage"
          title="Invalid service"
          description="Use a service link from Outcomes or the services list."
          primaryAction={
            <MotionAction>
              <Link href="/services" style={actionLinkStyle("primary")}>
                Back to services
              </Link>
            </MotionAction>
          }
        />
      </main>
    );
  }

  if (loading) {
    return (
      <main className="pf-page-services" style={{ padding: 0 }}>
        <OperatorPageTransition>
          <OperatorLoadingState variant="section" skeleton="cards" title="Loading service coverage…" />
        </OperatorPageTransition>
      </main>
    );
  }

  if (notFound) {
    return (
      <main className="pf-page-services" style={{ padding: 0 }}>
        <PageCommandHeader
          animate={false}
          tone="default"
          eyebrow="Coverage"
          title="Service not found"
          description="This service may have been removed or is outside your workspace."
          primaryAction={
            <MotionAction>
              <Link href="/services" style={actionLinkStyle("primary")}>
                Back to services
              </Link>
            </MotionAction>
          }
        />
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="pf-page-services" style={{ padding: 0 }}>
        <OperatorPageTransition>
          <div style={{ marginTop: 16 }}>
            <OperatorErrorState
              rawMessage={error ?? "Couldn’t load coverage drilldown."}
              primaryAction={<ActionButton onClick={() => void reload()}>Try again</ActionButton>}
            />
          </div>
        </OperatorPageTransition>
      </main>
    );
  }

  return (
    <main className="pf-page-services" style={{ padding: 0 }}>
      <OperatorPageTransition>
        <PageCommandHeader
          animate={false}
          tone="default"
          eyebrow="Service coverage"
          title={data.service_name}
          description="Who is watching this service on standby, how reachable they are, and what no-match audits say for recent openings."
          primaryAction={
            <MotionAction>
              <Link href="/outcomes" style={actionLinkStyle("secondary")}>
                ← Outcomes
              </Link>
            </MotionAction>
          }
          secondaryAction={
            <MotionAction>
              <Link href="/services" style={actionLinkStyle("secondary")}>
                All services
              </Link>
            </MotionAction>
          }
          style={{ marginBottom: 20 }}
        />

        <p className="pf-muted-copy" style={{ margin: "0 0 16px", fontSize: 12 }}>
          {data.period.label} · openings created in this window drive the no-match sample below.
        </p>

        <div style={{ display: "grid", gap: 16, maxWidth: 720 }}>
          <SectionCard eyebrow="Standby" title="Watchers & reachability">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 12 }}>
              <div>
                <p className="pf-meta-row" style={{ margin: 0, fontSize: 10, opacity: 0.65 }}>
                  Watchers
                </p>
                <p style={{ margin: "6px 0 0", fontSize: 22, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
                  {data.watching_customer_count}
                </p>
                <p className="pf-muted-copy" style={{ margin: "6px 0 0", fontSize: 12, lineHeight: 1.45 }}>
                  Eligible customers whose standby includes this service (or any-service wildcard).
                </p>
              </div>
              <div>
                <p className="pf-meta-row" style={{ margin: 0, fontSize: 10, opacity: 0.65 }}>
                  Reachable
                </p>
                <p style={{ margin: "6px 0 0", fontSize: 22, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
                  {data.reachable_customer_count}
                </p>
                <p className="pf-muted-copy" style={{ margin: "6px 0 0", fontSize: 12, lineHeight: 1.45 }}>
                  Watchers with push + device, email, or SMS enabled for notifications.
                </p>
              </div>
              <div>
                <p className="pf-meta-row" style={{ margin: 0, fontSize: 10, opacity: 0.65 }}>
                  Recent openings
                </p>
                <p style={{ margin: "6px 0 0", fontSize: 22, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
                  {data.recent_openings_30d}
                </p>
                <p className="pf-muted-copy" style={{ margin: "6px 0 0", fontSize: 12, lineHeight: 1.45 }}>
                  Open slots for this service created in the rolling window.
                </p>
              </div>
            </div>
          </SectionCard>

          <SectionCard eyebrow="No-match" title="Patterns on recent openings">
            <p className="pf-muted-copy" style={{ margin: "0 0 10px", fontSize: 12 }}>
              {data.no_match_events_30d} no-match audit
              {data.no_match_events_30d === 1 ? "" : "s"} tied to those openings (operator-safe labels).
            </p>
            {data.top_no_match_reasons.length === 0 ? (
              <p className="pf-muted-copy" style={{ margin: 0, fontSize: 13 }}>
                No coarse no-match reasons recorded for this service in the sample — keep sending offers to build signal.
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {data.top_no_match_reasons.map((r) => (
                  <div
                    key={r.reason}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 12,
                      fontSize: 13,
                      color: "rgba(245,247,250,0.82)",
                    }}
                  >
                    <span style={{ minWidth: 0 }}>{r.label}</span>
                    <span className="pf-meta-row" style={{ fontVariantNumeric: "tabular-nums", flexShrink: 0 }}>
                      {r.count}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard eyebrow="Next step" title="Suggested action">
            <p style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 650 }}>{data.suggested_action.label}</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
              <MotionAction>
                <Link href={data.suggested_action.href} style={actionLinkStyle(data.suggested_action.priority)}>
                  Go
                </Link>
              </MotionAction>
              <MotionAction>
                <Link
                  href={`/open-slots/create?service_id=${encodeURIComponent(data.service_id)}`}
                  style={actionLinkStyle("secondary")}
                >
                  Create opening for this service
                </Link>
              </MotionAction>
            </div>
          </SectionCard>
        </div>
      </OperatorPageTransition>
    </main>
  );
}
