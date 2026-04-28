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
      label: "Send your first offers",
      done: state.hasOffersSent,
      href: "/open-slots?status=open",
      cta: "Send offers",
    },
    {
      label: "Confirm your first recovered booking",
      done: state.hasConfirmedBooking,
      href: "/claims",
      cta: "View claims",
    },
  ];

  const completed = steps.filter((step) => step.done).length;
  const firstIncomplete = steps.find((step) => !step.done);

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
          <h2 style={styles.title}>Guided activation</h2>
          <p style={styles.subtitle}>Finish the next action to move from setup to first recovered booking.</p>
        </div>
        <div style={styles.progressPill}>
          {completed}/{steps.length} complete
        </div>
      </div>

      {firstIncomplete ? (
        <div style={styles.nextStepCard}>
          <p style={styles.nextStepEyebrow}>Next best action</p>
          <h3 style={styles.nextStepTitle}>{firstIncomplete.label}</h3>
          <p style={styles.nextStepCopy}>
            {firstIncomplete.href === "/locations"
              ? "Tell PulseFill where openings happen."
              : "Complete this step first so the rest of the recovery workflow can progress."}
          </p>
          <Link href={firstIncomplete.href} style={styles.nextStepCta}>
            {firstIncomplete.cta}
          </Link>
        </div>
      ) : null}

      <div style={styles.stagesList}>
        {staged.map((step) => (
          <div key={step.label} style={styles.stageRow}>
            <div style={styles.stepLeft}>
              <div
                style={{
                  ...styles.statusDot,
                  background: step.done ? "rgba(34,197,94,0.95)" : "rgba(255,255,255,0.18)",
                }}
              />
              <div>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "var(--text)" }}>{step.label}</p>
                <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--muted)" }}>{step.detail}</p>
              </div>
            </div>
            <span style={step.done ? styles.doneText : styles.pendingText}>{step.done ? "Done" : "Pending"}</span>
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
  },
  stageRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(0,0,0,0.12)",
    borderRadius: 14,
    padding: "12px 14px",
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
  pendingText: {
    fontSize: 12,
    color: "rgba(245,247,251,0.55)",
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
