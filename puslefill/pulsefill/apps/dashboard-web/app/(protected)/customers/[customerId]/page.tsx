"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect } from "react";
import { PageCommandHeader } from "@/components/operator/page-command-header";
import { OperatorPageTransition } from "@/components/operator/operator-page-transition";
import { OperatorLoadingState } from "@/components/operator/operator-loading-state";
import { OperatorErrorState } from "@/components/operator/operator-error-state";
import { OperatorMetricStrip } from "@/components/operator/operator-metric-strip";
import { OperatorActionPanel } from "@/components/operator/operator-action-panel";
import { OperatorStatusChip } from "@/components/operator/operator-status-chip";
import type { OperatorStatusKind } from "@/components/operator/operator-status-chip";
import { MotionAction } from "@/components/operator/operator-motion-primitives";
import { actionLinkStyle } from "@/lib/operator-action-link-styles";
import { operatorSurfaceShell } from "@/lib/operator-surface-styles";
import { CustomerFollowUpActions } from "@/components/customers/customer-follow-up-actions";
import { CustomerInternalNotes } from "@/components/customers/customer-internal-notes";
import { CustomerTimelineSection } from "@/components/customers/customer-timeline-section";
import { useCustomerProfile } from "@/hooks/useCustomerProfile";
import { useCustomerNotes } from "@/hooks/useCustomerNotes";
import { useCustomerTimeline } from "@/hooks/useCustomerTimeline";

function reachabilityCopy(status: "reachable" | "limited" | "unreachable"): { title: string; body: string; chip: string; kind: OperatorStatusKind } {
  if (status === "reachable") {
    return {
      title: "Reachable",
      chip: "Reachable",
      kind: "live",
      body: "PulseFill can alert this customer about matching openings.",
    };
  }
  if (status === "limited") {
    return {
      title: "Limited reach",
      chip: "Limited reach",
      kind: "attention",
      body: "Some alert channels are missing.",
    };
  }
  return {
    title: "Unreachable",
    chip: "Unreachable",
    kind: "failed",
    body: "This customer may miss matching openings until contact settings are fixed.",
  };
}

export default function CustomerProfilePage() {
  const params = useParams();
  const customerId = typeof params?.customerId === "string" ? params.customerId : undefined;
  const { data, loading, error, reload } = useCustomerProfile(customerId);
  const notesState = useCustomerNotes(customerId);
  const timelineState = useCustomerTimeline(customerId);

  useEffect(() => {
    if (!customerId) return;
    void timelineState.reload();
  }, [customerId, notesState.notes, timelineState.reload]);

  if (!customerId) {
    return (
      <main style={{ padding: 0 }}>
        <OperatorErrorState rawMessage="Missing customer id." />
      </main>
    );
  }

  const reach = data ? reachabilityCopy(data.reachability.status) : null;

  return (
    <main className="pf-page-customer-profile" style={{ padding: 0 }}>
      <OperatorPageTransition>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <PageCommandHeader
            tone="default"
            eyebrow="Customers"
            title="Customer profile"
            description="Understand this customer's standby setup, reachability, and recovery history."
            secondaryAction={
              <MotionAction>
                <Link href="/customers" style={actionLinkStyle("secondary")}>
                  Back to customers
                </Link>
              </MotionAction>
            }
          />

          {error ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "flex-start" }}>
              <OperatorErrorState rawMessage={error} />
              <button
                type="button"
                onClick={() => void reload()}
                style={{
                  borderRadius: 8,
                  border: "1px solid rgba(255,255,255,0.14)",
                  background: "rgba(255,255,255,0.06)",
                  color: "var(--text)",
                  padding: "8px 12px",
                  fontSize: 12,
                  cursor: "pointer",
                }}
              >
                Retry
              </button>
            </div>
          ) : null}

          {loading && !data ? (
            <OperatorLoadingState variant="section" skeleton="rows" title="Loading customer…" />
          ) : null}

          {!loading && !error && data ? (
            <>
              <div
                style={{
                  padding: "14px 16px",
                  ...operatorSurfaceShell("quiet"),
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "8px 20px",
                  alignItems: "baseline",
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <p className="pf-section-title" style={{ margin: 0, fontSize: 18 }}>
                    {data.customer.display_name}
                  </p>
                  <p className="pf-meta-row" style={{ margin: "6px 0 0", fontSize: 12 }}>
                    {data.customer.email ? <span>{data.customer.email}</span> : null}
                    {data.customer.email && data.customer.phone ? <span> · </span> : null}
                    {data.customer.phone ? <span>{data.customer.phone}</span> : null}
                    {!data.customer.email && !data.customer.phone ? (
                      <span className="pf-muted-copy">No masked contact on file</span>
                    ) : null}
                  </p>
                </div>
                <span className="pf-meta-row" style={{ fontSize: 11, marginLeft: "auto" }}>
                  Joined PulseFill {new Date(data.customer.created_at).toLocaleDateString()}
                </span>
              </div>

              <CustomerFollowUpActions follow_up={data.follow_up} />

              <CustomerInternalNotes
                notes={notesState.notes}
                loading={notesState.loading}
                error={notesState.error}
                saving={notesState.saving}
                onAddNote={notesState.addNote}
                onCompleteFollowUp={notesState.completeFollowUp}
                onRetry={() => void notesState.reload()}
              />

              <CustomerTimelineSection
                items={timelineState.data?.items ?? []}
                loading={timelineState.loading}
                error={timelineState.error}
                notes={notesState.notes}
                onRetry={() => void timelineState.reload()}
              />

              {reach ? (
                <OperatorActionPanel
                  eyebrow="Reachability"
                  title={reach.title}
                  description={reach.body}
                  status={<OperatorStatusChip kind={reach.kind} label={reach.chip} caps />}
                  priority={data.reachability.status === "unreachable" ? "attention" : "normal"}
                />
              ) : null}

              <section style={{ padding: "14px 16px", ...operatorSurfaceShell("quiet") }}>
                <h2 className="pf-section-title" style={{ fontSize: 15, margin: "0 0 10px" }}>
                  Standby preferences
                </h2>
                {data.standby.active_preferences_count === 0 ? (
                  <>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: 14 }}>No active standby preferences</p>
                    <p className="pf-muted-copy" style={{ margin: "8px 0 0", fontSize: 13, lineHeight: 1.55 }}>
                      This customer is connected but has not chosen which openings they want yet.
                    </p>
                  </>
                ) : (
                  <div style={{ display: "grid", gap: 8, fontSize: 13 }}>
                    <p style={{ margin: 0 }}>
                      <span className="pf-muted-copy">Active preferences · </span>
                      <strong>{data.standby.active_preferences_count}</strong>
                    </p>
                    <p style={{ margin: 0 }}>
                      <span className="pf-muted-copy">Services watched · </span>
                      {data.standby.services.length > 0
                        ? data.standby.services.map((s) => s.name).join(", ")
                        : "—"}
                    </p>
                    <p style={{ margin: 0 }}>
                      <span className="pf-muted-copy">Locations watched · </span>
                      {data.standby.locations.length > 0
                        ? data.standby.locations.map((l) => l.name).join(", ")
                        : "—"}
                    </p>
                    <p style={{ margin: 0 }}>
                      <span className="pf-muted-copy">Availability · </span>
                      {data.standby.availability_summary}
                    </p>
                    <p style={{ margin: 0 }}>
                      <span className="pf-muted-copy">Notice window · </span>
                      {data.standby.notice_summary}
                    </p>
                  </div>
                )}
              </section>

              <section style={{ padding: "14px 16px", ...operatorSurfaceShell("quiet") }}>
                <h2 className="pf-section-title" style={{ fontSize: 15, margin: "0 0 12px" }}>
                  Claims
                </h2>
                <OperatorMetricStrip
                  compact
                  items={[
                    {
                      label: "Confirmed",
                      value: data.claims.confirmed,
                      emphasis: data.claims.confirmed > 0 ? "primary" : "default",
                      signal: data.claims.confirmed > 0 ? "live" : "idle",
                    },
                    {
                      label: "Waiting",
                      value: data.claims.waiting,
                      emphasis: data.claims.waiting > 0 ? "primary" : "default",
                      signal: data.claims.waiting > 0 ? "live" : "idle",
                    },
                    {
                      label: "Missed / expired",
                      value: data.claims.expired_or_missed,
                      emphasis: data.claims.expired_or_missed > 0 ? "primary" : "default",
                      signal: data.claims.expired_or_missed > 0 ? "live" : "idle",
                    },
                    {
                      label: "Total claims",
                      value: data.claims.total,
                      emphasis: "default",
                      signal: "idle",
                    },
                  ]}
                />
              </section>

              <section style={{ padding: "14px 16px", ...operatorSurfaceShell("quiet") }}>
                <h2 className="pf-section-title" style={{ fontSize: 15, margin: "0 0 12px" }}>
                  Notification delivery (30 days)
                </h2>
                <p className="pf-muted-copy" style={{ margin: "0 0 12px", fontSize: 12, lineHeight: 1.5 }}>
                  Staff-safe counts only — no device or token details.
                </p>
                <OperatorMetricStrip
                  compact
                  items={[
                    {
                      label: "Sent",
                      value: data.notification_delivery.sent_30d,
                      emphasis: data.notification_delivery.sent_30d > 0 ? "primary" : "default",
                      signal: data.notification_delivery.sent_30d > 0 ? "live" : "idle",
                    },
                    {
                      label: "Failed",
                      value: data.notification_delivery.failed_30d,
                      emphasis: data.notification_delivery.failed_30d > 0 ? "primary" : "default",
                      signal: data.notification_delivery.failed_30d > 0 ? "live" : "idle",
                    },
                    {
                      label: "Skipped",
                      value: data.notification_delivery.skipped_30d,
                      emphasis: "default",
                      signal: "idle",
                    },
                  ]}
                />
              </section>

              {data.next_actions.length > 0 ? (
                <section style={{ padding: "14px 16px", ...operatorSurfaceShell("operational") }}>
                  <h2 className="pf-section-title" style={{ fontSize: 15, margin: "0 0 12px" }}>
                    Next actions
                  </h2>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                    {data.next_actions.map((a) => (
                      <MotionAction key={`${a.label}-${a.href}`}>
                        <Link
                          href={a.href}
                          style={actionLinkStyle(a.priority === "primary" ? "primary" : "secondary")}
                        >
                          {a.label}
                        </Link>
                      </MotionAction>
                    ))}
                  </div>
                </section>
              ) : null}
            </>
          ) : null}
        </div>
      </OperatorPageTransition>
    </main>
  );
}
