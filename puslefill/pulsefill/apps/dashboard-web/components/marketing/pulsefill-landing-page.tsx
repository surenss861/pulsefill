"use client";

import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";

const TOKENS = {
  text: "var(--pf-text-primary)",
  muted: "var(--pf-text-secondary)",
  tertiary: "var(--pf-text-tertiary)",
  border: "var(--pf-border-default)",
  borderSubtle: "var(--pf-border-subtle)",
  surface: "var(--pf-card-bg)",
  quiet: "var(--pf-card-quiet-bg)",
  hero: "var(--pf-card-hero-bg)",
  violet: "var(--pf-accent-primary)",
  violetBorder: "var(--pf-accent-primary-border)",
  cyan: "var(--pf-accent-secondary)",
  cyanBorder: "var(--pf-accent-secondary-border)",
} as const;

const container: CSSProperties = {
  width: "100%",
  maxWidth: 1240,
  margin: "0 auto",
  padding: "0 24px",
};

function Container({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return <div style={{ ...container, ...style }}>{children}</div>;
}

function Pill({ children }: { children: ReactNode }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 12px",
        borderRadius: 999,
        border: `1px solid ${TOKENS.border}`,
        background: "rgba(255,255,255,0.04)",
        color: TOKENS.text,
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
      }}
    >
      {children}
    </span>
  );
}

function PrimaryButton({ children, href }: { children: ReactNode; href: string }) {
  return (
    <Link
      href={href}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 16,
        background: "var(--pf-btn-primary-bg)",
        color: "var(--pf-btn-primary-text)",
        padding: "14px 18px",
        fontSize: 14,
        fontWeight: 700,
        textDecoration: "none",
        boxShadow: "var(--pf-btn-primary-shadow)",
      }}
    >
      {children}
    </Link>
  );
}

function SecondaryButton({ children, href }: { children: ReactNode; href: string }) {
  return (
    <Link
      href={href}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 16,
        background: "var(--pf-btn-secondary-bg)",
        border: "1px solid var(--pf-btn-secondary-border)",
        color: TOKENS.text,
        padding: "14px 18px",
        fontSize: 14,
        fontWeight: 600,
        textDecoration: "none",
      }}
    >
      {children}
    </Link>
  );
}

function NavAnchor({ children, href }: { children: ReactNode; href: string }) {
  return (
    <a
      href={href}
      style={{
        border: "none",
        background: "transparent",
        color: "var(--pf-btn-link-text)",
        padding: "12px 0",
        fontSize: 14,
        fontWeight: 600,
        textDecoration: "none",
      }}
    >
      {children}
    </a>
  );
}

function SectionHeader({
  eyebrow,
  title,
  body,
  centered = false,
}: {
  eyebrow?: string;
  title: string;
  body?: string;
  centered?: boolean;
}) {
  return (
    <div
      style={{
        maxWidth: centered ? 860 : 740,
        textAlign: centered ? "center" : "left",
        margin: centered ? "0 auto" : "0",
      }}
    >
      {eyebrow ? (
        <div
          style={{
            color: TOKENS.tertiary,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            marginBottom: 12,
          }}
        >
          {eyebrow}
        </div>
      ) : null}

      <h2
        style={{
          margin: 0,
          color: TOKENS.text,
          fontSize: "clamp(28px, 4vw, 44px)",
          lineHeight: 1.02,
          letterSpacing: "-0.04em",
          fontWeight: 650,
        }}
      >
        {title}
      </h2>

      {body ? (
        <p
          style={{
            margin: "16px 0 0 0",
            color: TOKENS.muted,
            fontSize: 16,
            lineHeight: 1.75,
          }}
        >
          {body}
        </p>
      ) : null}
    </div>
  );
}

function GridCard({ title, body, tone = "default" }: { title: string; body: string; tone?: "default" | "quiet" }) {
  return (
    <div
      style={{
        background: tone === "quiet" ? TOKENS.quiet : TOKENS.surface,
        border: `1px solid ${TOKENS.border}`,
        borderRadius: 24,
        padding: 24,
        boxShadow: "var(--pf-card-shadow)",
      }}
    >
      <div style={{ color: TOKENS.text, fontSize: 18, fontWeight: 620, lineHeight: 1.2 }}>{title}</div>
      <p style={{ margin: "12px 0 0 0", color: TOKENS.muted, fontSize: 14, lineHeight: 1.75 }}>{body}</p>
    </div>
  );
}

function MetricTile({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div
      style={{
        background: accent ? "rgba(255,255,255,0.06)" : TOKENS.quiet,
        border: `1px solid ${accent ? TOKENS.violetBorder : TOKENS.borderSubtle}`,
        borderRadius: 20,
        padding: 18,
      }}
    >
      <div
        style={{
          color: TOKENS.tertiary,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </div>
      <div
        style={{
          marginTop: 10,
          color: TOKENS.text,
          fontSize: 30,
          lineHeight: 1,
          fontWeight: 650,
          letterSpacing: "-0.04em",
        }}
      >
        {value}
      </div>
    </div>
  );
}

function MockBrowserFrame({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div
      style={{
        borderRadius: 28,
        border: `1px solid ${TOKENS.border}`,
        background: "rgba(7,11,20,0.92)",
        overflow: "hidden",
        boxShadow: "0 18px 60px rgba(0,0,0,0.32)",
      }}
    >
      <div
        style={{
          height: 44,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 16px",
          borderBottom: `1px solid ${TOKENS.borderSubtle}`,
          background: "rgba(255,255,255,0.03)",
        }}
      >
        <div style={{ display: "flex", gap: 8 }}>
          <span style={{ width: 8, height: 8, borderRadius: 999, background: "rgba(255,255,255,0.25)" }} />
          <span style={{ width: 8, height: 8, borderRadius: 999, background: "rgba(255,255,255,0.16)" }} />
          <span style={{ width: 8, height: 8, borderRadius: 999, background: "rgba(255,255,255,0.1)" }} />
        </div>
        <div style={{ color: TOKENS.tertiary, fontSize: 12, fontWeight: 600 }}>{title}</div>
        <div style={{ width: 44 }} />
      </div>
      <div style={{ padding: 18 }}>{children}</div>
    </div>
  );
}

function MockPhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        width: "100%",
        maxWidth: 290,
        margin: "0 auto",
        borderRadius: 36,
        border: `1px solid ${TOKENS.border}`,
        background: "rgba(7,11,20,0.96)",
        padding: 10,
        boxShadow: "0 18px 60px rgba(0,0,0,0.36)",
      }}
    >
      <div
        style={{
          borderRadius: 28,
          overflow: "hidden",
          border: `1px solid ${TOKENS.borderSubtle}`,
          background: "linear-gradient(180deg, rgba(21,32,51,0.96), rgba(11,18,32,0.96))",
          minHeight: 520,
        }}
      >
        {children}
      </div>
    </div>
  );
}

function OperatorDashboardMock() {
  return (
    <MockBrowserFrame title="PulseFill — Operator">
      <div style={{ display: "grid", gap: 14 }}>
        <div
          style={{
            background: "var(--pf-card-hero-bg)",
            border: `1px solid ${TOKENS.violetBorder}`,
            borderRadius: 22,
            padding: 18,
          }}
        >
          <div
            style={{
              color: TOKENS.tertiary,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
            }}
          >
            Today&apos;s recovery
          </div>
          <div
            style={{
              display: "grid",
              gap: 12,
              marginTop: 14,
              gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
            }}
          >
            <MetricTile label="Recovered" value="12" accent />
            <MetricTile label="Revenue" value="$1.8K" accent />
            <MetricTile label="Awaiting" value="4" />
            <MetricTile label="Failed" value="3" />
          </div>
        </div>
        <div
          style={{
            display: "grid",
            gap: 14,
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          }}
        >
          <div
            style={{
              borderRadius: 22,
              border: `1px solid ${TOKENS.border}`,
              background: TOKENS.surface,
              padding: 16,
            }}
          >
            <div style={{ color: TOKENS.text, fontSize: 15, fontWeight: 620 }}>What to work first</div>
            <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
              {[
                ["Work first", "6"],
                ["Manual follow-up", "4"],
                ["Improve coverage", "3"],
              ].map(([label, count]) => (
                <div
                  key={label}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px 14px",
                    borderRadius: 16,
                    background: "rgba(255,255,255,0.04)",
                    border: `1px solid ${TOKENS.borderSubtle}`,
                    color: TOKENS.text,
                    fontSize: 13,
                  }}
                >
                  <span>{label}</span>
                  <span style={{ color: TOKENS.cyan, fontWeight: 700 }}>{count}</span>
                </div>
              ))}
            </div>
          </div>
          <div
            style={{
              borderRadius: 22,
              border: `1px solid ${TOKENS.border}`,
              background: TOKENS.surface,
              padding: 16,
            }}
          >
            <div style={{ color: TOKENS.text, fontSize: 15, fontWeight: 620 }}>Needs attention now</div>
            <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
              {[
                ["Botox Consult", "Awaiting confirmation"],
                ["Hygiene Visit", "Delivery failed"],
              ].map(([t, reason]) => (
                <div
                  key={t}
                  style={{
                    borderRadius: 16,
                    background: "rgba(255,255,255,0.04)",
                    border: `1px solid ${TOKENS.borderSubtle}`,
                    padding: 12,
                  }}
                >
                  <div style={{ color: TOKENS.text, fontSize: 13, fontWeight: 620 }}>{t}</div>
                  <div style={{ marginTop: 6, color: TOKENS.muted, fontSize: 12 }}>{reason}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </MockBrowserFrame>
  );
}

function CustomerMobileMock() {
  return (
    <MockPhoneFrame>
      <div style={{ padding: 18 }}>
        <div
          style={{
            color: TOKENS.tertiary,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
          }}
        >
          Standby
        </div>
        <div
          style={{
            marginTop: 10,
            color: TOKENS.text,
            fontSize: 24,
            lineHeight: 1.05,
            letterSpacing: "-0.03em",
            fontWeight: 650,
          }}
        >
          Openings that fit your preferences.
        </div>
        <p style={{ marginTop: 10, color: TOKENS.muted, fontSize: 14, lineHeight: 1.7 }}>
          Join standby, manage your preferences, and claim relevant openings when they appear.
        </p>
        <div style={{ display: "grid", gap: 12, marginTop: 22 }}>
          <div
            style={{
              borderRadius: 20,
              padding: 16,
              background: "var(--pf-card-hero-bg)",
              border: `1px solid ${TOKENS.cyanBorder}`,
            }}
          >
            <div style={{ color: TOKENS.text, fontSize: 15, fontWeight: 620 }}>Offer available</div>
            <div style={{ marginTop: 8, color: TOKENS.muted, fontSize: 13 }}>Yorkville Clinic · Today at 2:30 PM</div>
            <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
              <div
                style={{
                  flex: 1,
                  borderRadius: 14,
                  padding: "12px 14px",
                  background: TOKENS.violet,
                  color: "#fff",
                  fontSize: 13,
                  fontWeight: 700,
                  textAlign: "center",
                }}
              >
                Claim opening
              </div>
              <div
                style={{
                  flex: 1,
                  borderRadius: 14,
                  padding: "12px 14px",
                  background: "rgba(255,255,255,0.05)",
                  border: `1px solid ${TOKENS.borderSubtle}`,
                  color: TOKENS.text,
                  fontSize: 13,
                  fontWeight: 600,
                  textAlign: "center",
                }}
              >
                Open detail
              </div>
            </div>
          </div>
          {["Preferences set", "Standby active", "2 recent updates"].map((item) => (
            <div
              key={item}
              style={{
                borderRadius: 16,
                padding: 14,
                background: "rgba(255,255,255,0.04)",
                border: `1px solid ${TOKENS.borderSubtle}`,
                color: TOKENS.text,
                fontSize: 13,
              }}
            >
              {item}
            </div>
          ))}
        </div>
      </div>
    </MockPhoneFrame>
  );
}

const STEPS: { step: string; title: string; body: string }[] = [
  {
    step: "1",
    title: "A slot opens",
    body: "A same-day or near-term cancellation creates a recovery opportunity.",
  },
  {
    step: "2",
    title: "PulseFill matches standby demand",
    body: "Relevant customers are identified based on preferences, availability, and recovery rules.",
  },
  {
    step: "3",
    title: "The operator workflow kicks in",
    body: "Your team sees what needs attention, retries where appropriate, and confirms valid recoveries.",
  },
  {
    step: "4",
    title: "Recovered bookings become visible",
    body: "Teams can track recovered appointments, recovered revenue, and workflow bottlenecks in one place.",
  },
];

export function PulseFillLandingPage() {
  const demoHref = "mailto:hello@pulsefill.com?subject=PulseFill%20demo";
  const workflowHref = "/login";

  return (
    <main
      style={{
        minHeight: "100vh",
        color: TOKENS.text,
        background:
          "radial-gradient(circle at top right, rgba(124,58,237,0.18), transparent 18%), radial-gradient(circle at top left, rgba(34,211,238,0.1), transparent 16%), var(--pf-shell-bg)",
      }}
    >
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 20,
          backdropFilter: "blur(14px)",
          background: "rgba(7,11,20,0.72)",
          borderBottom: `1px solid ${TOKENS.borderSubtle}`,
        }}
      >
        <Container
          style={{
            minHeight: 76,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            flexWrap: "wrap",
            paddingTop: 12,
            paddingBottom: 12,
          }}
        >
          <div style={{ color: TOKENS.text, fontSize: 18, fontWeight: 700, letterSpacing: "-0.02em" }}>PulseFill</div>
          <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" }}>
            <NavAnchor href="#how-it-works">How it works</NavAnchor>
            <NavAnchor href="#product">Product</NavAnchor>
            <SecondaryButton href={workflowHref}>Operator sign in</SecondaryButton>
            <PrimaryButton href={demoHref}>Book a demo</PrimaryButton>
          </div>
        </Container>
      </header>

      <section style={{ padding: "clamp(48px, 8vw, 84px) 0 clamp(28px, 5vw, 52px) 0" }}>
        <Container>
          <div
            style={{
              display: "grid",
              gap: "clamp(24px, 4vw, 36px)",
              alignItems: "center",
              gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))",
            }}
          >
            <div>
              <Pill>Appointment recovery operating system</Pill>
              <h1
                style={{
                  margin: "20px 0 0 0",
                  color: TOKENS.text,
                  fontSize: "clamp(40px, 6vw, 72px)",
                  lineHeight: 0.94,
                  letterSpacing: "-0.055em",
                  fontWeight: 680,
                  maxWidth: 760,
                }}
              >
                Recover same-day cancellations before they become lost revenue.
              </h1>
              <p
                style={{
                  margin: "22px 0 0 0",
                  color: TOKENS.muted,
                  fontSize: "clamp(16px, 2vw, 18px)",
                  lineHeight: 1.8,
                  maxWidth: 700,
                }}
              >
                PulseFill helps appointment businesses fill near-term openings through a two-sided standby system, a
                clear operator recovery workflow, and rules-based prioritization your team can actually trust.
              </p>
              <div style={{ display: "flex", gap: 14, marginTop: 28, flexWrap: "wrap" }}>
                <PrimaryButton href={demoHref}>Book a demo</PrimaryButton>
                <SecondaryButton href={workflowHref}>See operator workflow</SecondaryButton>
              </div>
              <p style={{ marginTop: 18, color: TOKENS.tertiary, fontSize: 13, lineHeight: 1.7, maxWidth: 560 }}>
                Built for clinics and appointment-based teams handling fast-moving schedule changes.
              </p>
            </div>
            <div
              style={{
                display: "grid",
                gap: 18,
                alignItems: "stretch",
                gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 260px), 1fr))",
              }}
            >
              <OperatorDashboardMock />
              <CustomerMobileMock />
            </div>
          </div>
        </Container>
      </section>

      <section style={{ padding: "12px 0 48px 0" }}>
        <Container>
          <div
            style={{
              borderTop: `1px solid ${TOKENS.borderSubtle}`,
              borderBottom: `1px solid ${TOKENS.borderSubtle}`,
              padding: "18px 0",
              display: "flex",
              flexWrap: "wrap",
              gap: 16,
              justifyContent: "space-between",
              color: TOKENS.tertiary,
              fontSize: 12,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
            }}
          >
            <span>Near-term recovery</span>
            <span>Operator workflow</span>
            <span>Standby demand</span>
            <span>Recovered revenue</span>
            <span>Explainable logic</span>
          </div>
        </Container>
      </section>

      <section id="problem" style={{ padding: "56px 0" }}>
        <Container>
          <SectionHeader
            eyebrow="The problem"
            title="Empty openings create more than idle time. They create lost revenue, broken rhythm, and manual chaos."
            body="When cancellations happen close to appointment time, most teams are stuck scrambling across calls, texts, waitlists, and memory. Openings expire fast — and generic scheduling tools don't run a real recovery workflow."
          />
          <div
            style={{
              marginTop: 28,
              display: "grid",
              gap: 18,
              gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 240px), 1fr))",
            }}
          >
            <GridCard
              title="Manual follow-up burns staff time"
              body="Front-desk teams end up chasing recovery through ad hoc messages, callbacks, and spreadsheets."
            />
            <GridCard
              title="Near-term openings expire fast"
              body="The closer the slot, the smaller the recovery window — and the more costly every delay becomes."
            />
            <GridCard
              title="Most tools stop at scheduling"
              body="They store appointments, but they don't actively run cancellation recovery."
            />
            <GridCard
              title="You can't improve what you can't see"
              body="Without clear recovery visibility, it's hard to know whether the issue is matching, delivery, or confirmation."
            />
          </div>
        </Container>
      </section>

      <section id="model" style={{ padding: "56px 0" }}>
        <Container>
          <SectionHeader
            eyebrow="The model"
            title="A two-sided standby system built for appointment recovery"
            body="PulseFill connects standby demand on the customer side with a fast, explainable recovery workflow on the operator side."
          />
          <div
            style={{
              marginTop: 28,
              display: "grid",
              gap: 20,
              gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 300px), 1fr))",
            }}
          >
            <div
              style={{
                background: TOKENS.surface,
                border: `1px solid ${TOKENS.border}`,
                borderRadius: 28,
                padding: 28,
                boxShadow: "var(--pf-card-shadow)",
              }}
            >
              <div style={{ color: TOKENS.cyan, fontSize: 13, fontWeight: 700 }}>Customer side</div>
              <h3
                style={{
                  margin: "12px 0 0 0",
                  color: TOKENS.text,
                  fontSize: 28,
                  lineHeight: 1.08,
                  letterSpacing: "-0.03em",
                }}
              >
                Customers join standby
              </h3>
              <p style={{ margin: "14px 0 0 0", color: TOKENS.muted, lineHeight: 1.8, fontSize: 15 }}>
                Customers opt into standby, set their preferences, and get notified when relevant openings become
                available.
              </p>
              <ul style={{ margin: "18px 0 0 0", padding: 0, listStyle: "none", display: "grid", gap: 12 }}>
                {[
                  "Choose preferences",
                  "Receive matched openings",
                  "Claim relevant offers quickly",
                  "Stay informed through activity and status",
                ].map((item) => (
                  <li
                    key={item}
                    style={{
                      color: TOKENS.text,
                      fontSize: 14,
                      lineHeight: 1.65,
                      padding: "12px 14px",
                      borderRadius: 16,
                      background: "rgba(255,255,255,0.04)",
                      border: `1px solid ${TOKENS.borderSubtle}`,
                    }}
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div
              style={{
                background: TOKENS.surface,
                border: `1px solid ${TOKENS.border}`,
                borderRadius: 28,
                padding: 28,
                boxShadow: "var(--pf-card-shadow)",
              }}
            >
              <div style={{ color: TOKENS.violet, fontSize: 13, fontWeight: 700 }}>Operator side</div>
              <h3
                style={{
                  margin: "12px 0 0 0",
                  color: TOKENS.text,
                  fontSize: 28,
                  lineHeight: 1.08,
                  letterSpacing: "-0.03em",
                }}
              >
                Operators run recovery
              </h3>
              <p style={{ margin: "14px 0 0 0", color: TOKENS.muted, lineHeight: 1.8, fontSize: 15 }}>
                Operators see what needs attention, confirm recoveries, retry where appropriate, and track what was
                saved.
              </p>
              <ul style={{ margin: "18px 0 0 0", padding: 0, listStyle: "none", display: "grid", gap: 12 }}>
                {[
                  "Queue urgent recovery work",
                  "Inspect slot detail with context",
                  "Retry, confirm, or follow up",
                  "Track recovered bookings and revenue",
                ].map((item) => (
                  <li
                    key={item}
                    style={{
                      color: TOKENS.text,
                      fontSize: 14,
                      lineHeight: 1.65,
                      padding: "12px 14px",
                      borderRadius: 16,
                      background: "rgba(255,255,255,0.04)",
                      border: `1px solid ${TOKENS.borderSubtle}`,
                    }}
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Container>
      </section>

      <section id="how-it-works" style={{ padding: "56px 0" }}>
        <Container>
          <SectionHeader
            eyebrow="How it works"
            title="How PulseFill turns cancellations into recoveries"
            body="A rules-based workflow that connects standby demand, operator action, and recovered bookings."
            centered
          />
          <div
            style={{
              marginTop: 32,
              display: "grid",
              gap: 18,
              gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))",
            }}
          >
            {STEPS.map(({ step, title, body }) => (
              <div
                key={step}
                style={{
                  background: TOKENS.surface,
                  border: `1px solid ${TOKENS.border}`,
                  borderRadius: 24,
                  padding: 22,
                  boxShadow: "var(--pf-card-shadow)",
                }}
              >
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 999,
                    display: "grid",
                    placeItems: "center",
                    background: "var(--pf-accent-primary-soft)",
                    border: `1px solid ${TOKENS.violetBorder}`,
                    color: TOKENS.text,
                    fontWeight: 700,
                    fontSize: 14,
                  }}
                >
                  {step}
                </div>
                <div style={{ marginTop: 16, color: TOKENS.text, fontSize: 18, fontWeight: 620, lineHeight: 1.2 }}>
                  {title}
                </div>
                <p style={{ margin: "12px 0 0 0", color: TOKENS.muted, fontSize: 14, lineHeight: 1.75 }}>{body}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section id="product" style={{ padding: "56px 0" }}>
        <Container>
          <SectionHeader
            eyebrow="Product surfaces"
            title="Built for the team running recovery — and the customers ready to take openings"
            body="PulseFill gives operators a clear recovery workflow and gives customers a simple standby experience."
          />
          <div
            style={{
              marginTop: 28,
              display: "grid",
              gap: 20,
              gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))",
            }}
          >
            <OperatorDashboardMock />
            <CustomerMobileMock />
          </div>
        </Container>
      </section>

      <section id="why" style={{ padding: "56px 0" }}>
        <Container>
          <SectionHeader
            eyebrow="Why PulseFill"
            title="More than reminders. More than scheduling. A real recovery workflow."
            body="PulseFill is built around near-term appointment recovery, not generic appointment storage or generic messaging."
            centered
          />
          <div
            style={{
              marginTop: 28,
              display: "grid",
              gap: 18,
              gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 260px), 1fr))",
            }}
          >
            <GridCard
              title="Designed for near-term recovery"
              body="Built around same-day and short-window cancellations where speed and clarity matter most."
            />
            <GridCard
              title="Rules-based and explainable"
              body="Teams can see why a slot needs attention and what action makes sense — no black-box workflow theater."
            />
            <GridCard
              title="One product across both sides"
              body="Customers manage standby demand while operators run recovery execution in the same system."
            />
          </div>
        </Container>
      </section>

      <section id="value" style={{ padding: "56px 0" }}>
        <Container>
          <SectionHeader
            eyebrow="Value"
            title="Track the outcomes that actually matter"
            body="PulseFill helps teams see what was recovered, what was missed, and where recovery is getting stuck."
          />
          <div
            style={{
              marginTop: 28,
              display: "grid",
              gap: 18,
              gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 140px), 1fr))",
            }}
          >
            <MetricTile label="Recovered bookings" value="12" accent />
            <MetricTile label="Recovered revenue" value="$1.8K" accent />
            <MetricTile label="Fill-rate visibility" value="Live" />
            <MetricTile label="Workflow visibility" value="Clear" />
            <MetricTile label="Manual chaos" value="Reduced" />
          </div>
        </Container>
      </section>

      <section id="trust" style={{ padding: "56px 0" }}>
        <Container>
          <SectionHeader
            eyebrow="Trust"
            title="A recovery workflow your team can understand and trust"
            body="PulseFill is built around clear recovery logic: what needs attention, what can wait, what failed to deliver, what needs confirmation, and where standby coverage is weak."
          />
          <div
            style={{
              marginTop: 24,
              display: "grid",
              gap: 14,
              gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 160px), 1fr))",
            }}
          >
            {[
              "Clear queue reasons",
              "Explicit operator actions",
              "Delivery visibility",
              "Workflow breakdowns",
              "No black-box guessing",
            ].map((item) => (
              <div
                key={item}
                style={{
                  borderRadius: 18,
                  border: `1px solid ${TOKENS.border}`,
                  background: "rgba(255,255,255,0.04)",
                  padding: "16px 14px",
                  color: TOKENS.text,
                  fontSize: 14,
                  lineHeight: 1.55,
                }}
              >
                {item}
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section style={{ padding: "72px 0 48px 0" }}>
        <Container>
          <div
            style={{
              background: TOKENS.hero,
              border: `1px solid ${TOKENS.violetBorder}`,
              borderRadius: 32,
              padding: "clamp(28px, 5vw, 40px)",
              boxShadow: "var(--pf-card-shadow)",
              textAlign: "center",
            }}
          >
            <h2
              style={{
                margin: 0,
                color: TOKENS.text,
                fontSize: "clamp(30px, 4.5vw, 52px)",
                lineHeight: 1.02,
                letterSpacing: "-0.04em",
                fontWeight: 650,
              }}
            >
              Run cancellation recovery like an operating system — not a scramble.
            </h2>
            <p
              style={{
                margin: "16px auto 0 auto",
                maxWidth: 760,
                color: TOKENS.muted,
                fontSize: "clamp(15px, 2vw, 17px)",
                lineHeight: 1.8,
              }}
            >
              PulseFill helps appointment businesses turn near-term openings into recovered bookings through a
              two-sided standby system and a clear operator workflow.
            </p>
            <div
              style={{
                marginTop: 28,
                display: "flex",
                justifyContent: "center",
                gap: 14,
                flexWrap: "wrap",
              }}
            >
              <PrimaryButton href={demoHref}>Book a demo</PrimaryButton>
              <SecondaryButton href={workflowHref}>See the operator workflow</SecondaryButton>
            </div>
          </div>
        </Container>
      </section>

      <footer
        style={{
          borderTop: `1px solid ${TOKENS.borderSubtle}`,
          padding: "32px 0 48px",
          color: TOKENS.muted,
          fontSize: 13,
        }}
      >
        <Container
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 16,
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span style={{ color: TOKENS.text, fontWeight: 600 }}>PulseFill</span>
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
            <Link href="/login" style={{ color: "var(--pf-btn-link-text)", textDecoration: "none", fontWeight: 600 }}>
              Operator sign in
            </Link>
            <a href={demoHref} style={{ color: "var(--pf-btn-link-text)", textDecoration: "none", fontWeight: 600 }}>
              Book a demo
            </a>
          </div>
          <span>© {new Date().getFullYear()} PulseFill</span>
        </Container>
      </footer>
    </main>
  );
}
