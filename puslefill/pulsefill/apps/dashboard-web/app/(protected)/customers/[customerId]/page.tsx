"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect } from "react";
import { OperatorPageTransition } from "@/components/operator/operator-page-transition";
import { OperatorLoadingState } from "@/components/operator/operator-loading-state";
import { OperatorErrorState } from "@/components/operator/operator-error-state";
import { OperatorStatusChip } from "@/components/operator/operator-status-chip";
import type { OperatorStatusKind } from "@/components/operator/operator-status-chip";
import { MotionAction } from "@/components/operator/operator-motion-primitives";
import { DeskPageHeader } from "@/components/dashboard/desk/desk-page-header";
import { DeskHeroCard } from "@/components/dashboard/desk/desk-hero-card";
import { DeskSecondaryCard } from "@/components/dashboard/desk/desk-secondary-card";
import { CustomerFollowUpActions } from "@/components/customers/customer-follow-up-actions";
import { CustomerInternalNotes } from "@/components/customers/customer-internal-notes";
import { CustomerTimelineSection } from "@/components/customers/customer-timeline-section";
import { useCustomerProfile } from "@/hooks/useCustomerProfile";
import type { CustomerProfilePayload } from "@/hooks/useCustomerProfile";
import { useCustomerNotes } from "@/hooks/useCustomerNotes";
import { useCustomerTimeline } from "@/hooks/useCustomerTimeline";

function deskWaitlistEyebrow(data: CustomerProfilePayload): string {
  const m = data.membership.status;
  if (m === "revoked") return "Not on your waitlist";
  if (m === "none") return "Needs invite";
  if (m === "pending") return "Invite pending";
  if (data.standby.active_preferences_count === 0) return "Needs preferences";
  return "Ready for openings";
}

function channelsReachLine(r: CustomerProfilePayload["reachability"]): string {
  const parts: string[] = [];
  if (r.sms_enabled) parts.push("text");
  if (r.email_enabled) parts.push("email");
  if (r.push_enabled && r.active_push_devices > 0) {
    parts.push(r.active_push_devices > 1 ? "app alerts" : "app alert");
  }
  if (parts.length === 0) return "No alert channels are on yet — they may miss openings.";
  if (parts.length === 1) return `Can receive openings by ${parts[0]}.`;
  if (parts.length === 2) return `Can receive openings by ${parts[0]} or ${parts[1]}.`;
  return `Can receive openings by ${parts.slice(0, -1).join(", ")}, or ${parts[parts.length - 1]}.`;
}

function reachabilityDeskCopy(
  status: "reachable" | "limited" | "unreachable",
): { chip: string; kind: OperatorStatusKind; hint: string } {
  if (status === "reachable") {
    return {
      chip: "Can be reached",
      kind: "live",
      hint: "We can route matching openings to their channels when something fits.",
    };
  }
  if (status === "limited") {
    return {
      chip: "Limited contact",
      kind: "attention",
      hint: "Some channels are off — time-sensitive openings are easier to miss.",
    };
  }
  return {
    chip: "Can't reach yet",
    kind: "failed",
    hint: "They may miss openings until contact settings are fixed.",
  };
}

function membershipBody(data: CustomerProfilePayload): string {
  const { membership } = data;
  if (membership.status === "none") {
    return "Not connected to your workspace yet. Send an invite when you want them on the waitlist.";
  }
  if (membership.status === "pending") {
    return "They have not finished joining from your invite.";
  }
  if (membership.status === "revoked") {
    return "They are no longer connected for openings.";
  }
  const joined = membership.joined_at ?? data.customer.created_at;
  const when = joined ? new Date(joined).toLocaleDateString() : "";
  const source =
    membership.source === "invite"
      ? "Invite"
      : membership.source === "request"
        ? "Waitlist request"
        : membership.source === "public"
          ? "Customer link"
          : "Connected";
  if (when) return `Connected ${when} · ${source}`;
  return `Connected · ${source}`;
}

function interestSentence(data: CustomerProfilePayload): string | null {
  if (data.standby.services.length === 0) {
    if (data.standby.active_preferences_count > 0) {
      return "Standby preferences are on file.";
    }
    return null;
  }
  const names = data.standby.services.map((s) => s.name);
  if (names.length === 1) return `Interested in ${names[0]}.`;
  if (names.length === 2) return `Interested in ${names[0]} and ${names[1]}.`;
  return `Interested in ${names.slice(0, 2).join(", ")}, and ${names.length - 2} more.`;
}

function deskStatRow(label: string, value: number, emphasize: boolean) {
  return (
    <div
      key={label}
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: 12,
        fontSize: 13,
        alignItems: "baseline",
      }}
    >
      <span className="pf-muted-copy">{label}</span>
      <strong
        style={{
          fontWeight: 650,
          fontVariantNumeric: "tabular-nums",
          color: emphasize ? "var(--pf-text-primary)" : undefined,
        }}
      >
        {value}
      </strong>
    </div>
  );
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

  const reachDesk = data ? reachabilityDeskCopy(data.reachability.status) : null;
  const interestLine = data ? interestSentence(data) : null;

  const headerActions = (
    <Link href="/customers" prefetch={false} className="pf-desk-quiet-link" style={{ marginTop: 0 }}>
      Back to waitlist
    </Link>
  );

  if (!customerId) {
    return (
      <main style={{ padding: 0 }}>
        <OperatorErrorState rawMessage="Missing customer id." />
      </main>
    );
  }

  return (
    <main className="pf-page-customer-profile pf-desk-page" style={{ padding: 0 }}>
      <OperatorPageTransition>
        <div className="pf-overview-desk-stack">
          <DeskPageHeader
            title="Customer"
            subtitle="Who they are, whether they can get openings, and what already happened."
            actions={headerActions}
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
            <OperatorLoadingState variant="section" skeleton="rows" title="Loading waitlist profile…" />
          ) : null}

          {!loading && !error && data ? (
            <>
              <DeskHeroCard title={data.customer.display_name} titleId="pf-customer-desk-hero-title" eyebrow={deskWaitlistEyebrow(data)}>
                <p className="pf-desk-hero-card__meta">
                  {[data.customer.email, data.customer.phone].filter(Boolean).join(" · ") ||
                    "No masked contact on file"}
                </p>
                <p className="pf-muted-copy" style={{ margin: "6px 0 0", fontSize: 12, lineHeight: 1.5 }}>
                  Joined PulseFill {new Date(data.customer.created_at).toLocaleDateString()}
                </p>
                <p className="pf-muted-copy" style={{ margin: "12px 0 0", fontSize: 14, lineHeight: 1.55 }}>
                  {channelsReachLine(data.reachability)}
                </p>
                {interestLine ? (
                  <p className="pf-muted-copy" style={{ margin: "8px 0 0", fontSize: 14, lineHeight: 1.55 }}>
                    {interestLine}
                  </p>
                ) : null}
                {reachDesk ? (
                  <>
                    <div style={{ marginTop: 12, display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
                      <OperatorStatusChip kind={reachDesk.kind} label={reachDesk.chip} />
                    </div>
                    <p className="pf-muted-copy" style={{ margin: "10px 0 0", fontSize: 13, lineHeight: 1.55 }}>
                      {reachDesk.hint}
                    </p>
                  </>
                ) : null}
                {data.next_actions.length > 0 ? (
                  <div style={{ marginTop: 16, display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
                    {data.next_actions.map((a) => (
                      <MotionAction key={`${a.label}-${a.href}`}>
                        <Link
                          href={a.href}
                          prefetch={false}
                          className={
                            a.priority === "primary" ? "pf-desk-save-access pf-desk-save-access--link" : "pf-desk-quiet-link"
                          }
                          style={a.priority === "primary" ? undefined : { marginTop: 0 }}
                        >
                          {a.label}
                        </Link>
                      </MotionAction>
                    ))}
                  </div>
                ) : null}
              </DeskHeroCard>

              <DeskSecondaryCard title="Contact">
                <CustomerFollowUpActions follow_up={data.follow_up} embedded />
              </DeskSecondaryCard>

              <DeskSecondaryCard title="Preferences">
                {data.standby.active_preferences_count === 0 ? (
                  <>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: 14 }}>Preferences missing</p>
                    <p className="pf-muted-copy" style={{ margin: "8px 0 0", fontSize: 13, lineHeight: 1.55 }}>
                      They are connected but have not told PulseFill which openings they want yet.
                    </p>
                  </>
                ) : (
                  <div style={{ display: "grid", gap: 10, fontSize: 13 }}>
                    <p style={{ margin: 0 }}>
                      <span className="pf-muted-copy">Preferences on file · </span>
                      <strong>{data.standby.active_preferences_count}</strong>
                    </p>
                    <p style={{ margin: 0 }}>
                      <span className="pf-muted-copy">Services · </span>
                      {data.standby.services.length > 0 ? data.standby.services.map((s) => s.name).join(", ") : "—"}
                    </p>
                    <p style={{ margin: 0 }}>
                      <span className="pf-muted-copy">Locations · </span>
                      {data.standby.locations.length > 0 ? data.standby.locations.map((l) => l.name).join(", ") : "—"}
                    </p>
                    <p style={{ margin: 0 }}>
                      <span className="pf-muted-copy">Times that work · </span>
                      {data.standby.availability_summary}
                    </p>
                    <p style={{ margin: 0 }}>
                      <span className="pf-muted-copy">Notice · </span>
                      {data.standby.notice_summary}
                    </p>
                  </div>
                )}
              </DeskSecondaryCard>

              <DeskSecondaryCard title="Invite status">
                <p className="pf-muted-copy" style={{ margin: 0, fontSize: 14, lineHeight: 1.55 }}>
                  {membershipBody(data)}
                </p>
              </DeskSecondaryCard>

              <DeskSecondaryCard title="What happened">
                <CustomerTimelineSection
                  embedded
                  items={timelineState.data?.items ?? []}
                  loading={timelineState.loading}
                  error={timelineState.error}
                  notes={notesState.notes}
                  onRetry={() => void timelineState.reload()}
                />
              </DeskSecondaryCard>

              <DeskSecondaryCard title="Claims and bookings">
                <div style={{ display: "grid", gap: 10 }}>
                  {deskStatRow("Booking confirmed", data.claims.confirmed, data.claims.confirmed > 0)}
                  {deskStatRow("Waiting on customer", data.claims.waiting, data.claims.waiting > 0)}
                  {deskStatRow("Missed or expired", data.claims.expired_or_missed, data.claims.expired_or_missed > 0)}
                  {deskStatRow("Total claims", data.claims.total, false)}
                </div>
              </DeskSecondaryCard>

              <DeskSecondaryCard title="Messages (last 30 days)">
                <p className="pf-muted-copy" style={{ margin: "0 0 10px", fontSize: 12, lineHeight: 1.5 }}>
                  Staff-safe counts only — no device or token details.
                </p>
                <div style={{ display: "grid", gap: 10 }}>
                  {deskStatRow("Sent", data.notification_delivery.sent_30d, data.notification_delivery.sent_30d > 0)}
                  {deskStatRow("Failed", data.notification_delivery.failed_30d, data.notification_delivery.failed_30d > 0)}
                  {deskStatRow("Skipped", data.notification_delivery.skipped_30d, false)}
                </div>
              </DeskSecondaryCard>

              <DeskSecondaryCard title="Team notes">
                <CustomerInternalNotes
                  embedded
                  notes={notesState.notes}
                  loading={notesState.loading}
                  error={notesState.error}
                  saving={notesState.saving}
                  onAddNote={notesState.addNote}
                  onCompleteFollowUp={notesState.completeFollowUp}
                  onRetry={() => void notesState.reload()}
                />
              </DeskSecondaryCard>
            </>
          ) : null}
        </div>
      </OperatorPageTransition>
    </main>
  );
}
