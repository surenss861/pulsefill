"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import type { SetupChecklistState } from "@/hooks/useSetupChecklistState";

export function GettingStartedCard({ state }: { state: SetupChecklistState }) {
  const steps = [
    {
      label: "Add your first location",
      done: state.hasLocation,
      href: "/locations",
      cta: "Add location",
    },
    {
      label: "Add a provider",
      done: state.hasProvider,
      href: "/providers",
      cta: "Add provider",
    },
    {
      label: "Add a service",
      done: state.hasService,
      href: "/services",
      cta: "Add service",
    },
    {
      label: "Create your first opening",
      done: state.hasOpenSlot,
      href: "/open-slots/create",
      cta: "Create opening",
    },
    {
      label: "Invite standby customers",
      done: state.hasOffersSent,
      href: "/customers",
      cta: "Invite customer",
    },
    {
      label: "Confirm your first recovered booking",
      done: state.hasConfirmedBooking,
      href: "/claims",
      cta: "Review claim",
    },
  ];

  const completed = steps.filter((step) => step.done).length;
  const firstIncomplete = steps.find((step) => !step.done);

  const nextStepBody = (() => {
    if (!firstIncomplete) return null;
    if (firstIncomplete.href === "/locations") {
      return "Tell PulseFill where openings happen before creating your first opening.";
    }
    if (firstIncomplete.href === "/providers") {
      return "Add who openings belong to so PulseFill can label recovery correctly.";
    }
    if (firstIncomplete.href === "/services") {
      return "Define appointment types so times and standby matches stay accurate.";
    }
    if (firstIncomplete.href === "/open-slots/create") {
      return "Create your first opening when a cancellation appears.";
    }
    if (firstIncomplete.href === "/customers") {
      return "Openings need active standby customers before offers can be sent.";
    }
    if (firstIncomplete.href === "/claims") {
      return "When a customer books from an offer, confirm the appointment here.";
    }
    return "Complete this step so the rest of the recovery workflow can move forward.";
  })();

  const staged = [
    {
      label: "1. Workspace basics",
      done: state.hasLocation && state.hasProvider && state.hasService,
      detail: "Locations, providers, and services",
    },
    {
      label: "2. First opening",
      done: state.hasOpenSlot,
      detail: "Service, provider, and time window",
    },
    {
      label: "3. Standby customers",
      done: state.hasOffersSent,
      detail: "Customer accepts invite and enables standby",
    },
    {
      label: "4. Recovered booking",
      done: state.hasConfirmedBooking,
      detail: "Send offer, customer claims, confirm booking",
    },
  ];

  return (
    <div id="getting-started" style={styles.card}>
      <div style={styles.headerRow}>
        <div>
          <h2 style={styles.title}>Workspace setup</h2>
          <p style={styles.subtitle}>Complete the basics so PulseFill can send openings to the right standby customers.</p>
        </div>
        <div style={styles.progressPill}>
          {completed}/{steps.length} complete
        </div>
      </div>

      {firstIncomplete ? (
        <div style={styles.nextStepCard}>
          <p style={styles.nextStepEyebrow}>Next best action</p>
          <h3 style={styles.nextStepTitle}>{firstIncomplete.label}</h3>
          <p style={styles.nextStepCopy}>{nextStepBody}</p>
          <Link href={firstIncomplete.href} style={styles.nextStepCta}>
            {firstIncomplete.cta}
          </Link>
        </div>
      ) : null}

      <p style={styles.progressLine}>
        Location → Provider → Service → Opening → Customers → Recovered booking
      </p>

      <div style={styles.stagesList}>
        {staged.map((step) => (
          <div
            key={step.label}
            style={{
              ...styles.stageRow,
              border: step.done ? "1px solid rgba(34,197,94,0.35)" : "1px solid rgba(255,255,255,0.08)",
              background: step.done ? "rgba(16,185,129,0.08)" : "rgba(0,0,0,0.12)",
            }}
          >
            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{step.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  card: {
    border: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(255,255,255,0.04)",
    borderRadius: 24,
    padding: 24,
    color: "var(--text)",
  },
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
    marginBottom: 20,
  },
  title: {
    margin: 0,
    fontSize: 22,
    fontWeight: 650,
    letterSpacing: "-0.02em",
  },
  subtitle: {
    margin: "8px 0 0 0",
    fontSize: 14,
    color: "var(--muted)",
    maxWidth: 520,
    lineHeight: 1.5,
  },
  progressPill: {
    border: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(255,255,255,0.06)",
    borderRadius: 999,
    padding: "8px 12px",
    fontSize: 12,
    color: "rgba(245,247,251,0.78)",
    whiteSpace: "nowrap",
  },
  stagesList: {
    display: "grid",
    gap: 10,
    marginTop: 18,
    gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
  },
  stageRow: {
    display: "flex",
    alignItems: "center",
    minHeight: 44,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(0,0,0,0.12)",
    borderRadius: 14,
    padding: "10px 12px",
  },
  stepLeft: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    flexShrink: 0,
  },
  doneText: {
    fontSize: 12,
    color: "rgba(34,197,94,0.95)",
  },
  nextStepCard: {
    border: "1px solid rgba(255, 122, 24, 0.24)",
    background: "rgba(255, 122, 24, 0.07)",
    borderRadius: 18,
    padding: 16,
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  nextStepEyebrow: {
    margin: 0,
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.16em",
    textTransform: "uppercase",
    color: "rgba(255,186,120,0.9)",
  },
  nextStepTitle: {
    margin: 0,
    fontSize: 18,
    fontWeight: 650,
    letterSpacing: "-0.01em",
  },
  nextStepCopy: {
    margin: 0,
    color: "var(--muted)",
    fontSize: 13,
  },
  progressLine: {
    margin: "16px 0 0",
    fontSize: 11,
    letterSpacing: "0.06em",
    color: "rgba(245, 247, 250, 0.42)",
    lineHeight: 1.5,
  },
  nextStepCta: {
    alignSelf: "flex-start",
    marginTop: 4,
    fontSize: 13,
    fontWeight: 600,
    color: "var(--text)",
    textDecoration: "none",
    border: "1px solid rgba(255,255,255,0.16)",
    background: "rgba(255,255,255,0.1)",
    borderRadius: 12,
    padding: "8px 12px",
  },
};
