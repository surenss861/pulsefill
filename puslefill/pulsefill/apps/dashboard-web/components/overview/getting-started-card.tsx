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
      label: "Create your first open slot",
      done: state.hasOpenSlot,
      href: "/open-slots/create",
      cta: "Create slot",
    },
    {
      label: "Send your first offers",
      done: state.hasOffersSent,
      href: "/open-slots",
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

  return (
    <div id="getting-started" style={styles.card}>
      <div style={styles.headerRow}>
        <div>
          <h2 style={styles.title}>Getting started</h2>
          <p style={styles.subtitle}>
            Set up the basics, then PulseFill can help recover cancelled appointments.
          </p>
        </div>
        <div style={styles.progressPill}>
          {completed}/{steps.length} complete
        </div>
      </div>

      <div style={styles.stepsList}>
        {steps.map((step) => (
          <div key={step.label} style={styles.stepRow}>
            <div style={styles.stepLeft}>
              <div
                style={{
                  ...styles.statusDot,
                  background: step.done ? "rgba(34,197,94,0.95)" : "rgba(255,255,255,0.18)",
                }}
              />
              <span style={{ ...styles.stepLabel, opacity: step.done ? 0.65 : 1 }}>{step.label}</span>
            </div>

            {!step.done ? (
              <Link href={step.href} style={styles.stepLink}>
                {step.cta}
              </Link>
            ) : (
              <span style={styles.doneText}>Done</span>
            )}
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
  stepsList: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  stepRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(0,0,0,0.16)",
    borderRadius: 18,
    padding: "14px 16px",
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
  stepLabel: {
    fontSize: 14,
    color: "var(--text)",
  },
  stepLink: {
    fontSize: 13,
    color: "var(--text)",
    textDecoration: "none",
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.06)",
    borderRadius: 12,
    padding: "8px 12px",
  },
  doneText: {
    fontSize: 12,
    color: "rgba(34,197,94,0.95)",
  },
};
