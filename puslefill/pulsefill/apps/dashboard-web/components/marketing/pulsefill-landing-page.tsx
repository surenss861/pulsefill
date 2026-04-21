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
  maxWidth: 1200,
  margin: "0 auto",
  padding: "0 24px",
};

function Container({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return <div style={{ ...container, ...style }}>{children}</div>;
}

function PrimaryButton({ children, href }: { children: ReactNode; href: string }) {
  return (
    <Link
      href={href}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 14,
        background: "var(--pf-btn-primary-bg)",
        color: "var(--pf-btn-primary-text)",
        padding: "13px 20px",
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
        borderRadius: 14,
        background: "var(--pf-btn-secondary-bg)",
        border: "1px solid var(--pf-btn-secondary-border)",
        color: TOKENS.text,
        padding: "13px 20px",
        fontSize: 14,
        fontWeight: 600,
        textDecoration: "none",
      }}
    >
      {children}
    </Link>
  );
}

function TextLink({ children, href }: { children: ReactNode; href: string }) {
  return (
    <Link
      href={href}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontSize: 14,
        fontWeight: 600,
        color: "var(--pf-btn-link-text)",
        textDecoration: "none",
        padding: "10px 0",
      }}
    >
      {children}
      <span style={{ opacity: 0.7 }} aria-hidden>
        →
      </span>
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
        fontSize: 13,
        fontWeight: 600,
        textDecoration: "none",
        letterSpacing: "0.02em",
      }}
    >
      {children}
    </a>
  );
}

function HeroEyebrow({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        display: "inline-block",
        color: TOKENS.tertiary,
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: "0.2em",
        textTransform: "uppercase",
        paddingBottom: 6,
        borderBottom: `1px solid ${TOKENS.borderSubtle}`,
        marginBottom: 4,
      }}
    >
      {children}
    </div>
  );
}

function MetricTile({ label, value, accent = false, compact = false }: { label: string; value: string; accent?: boolean; compact?: boolean }) {
  return (
    <div
      style={{
        background: accent ? "rgba(255,255,255,0.06)" : TOKENS.quiet,
        border: `1px solid ${accent ? TOKENS.violetBorder : TOKENS.borderSubtle}`,
        borderRadius: compact ? 16 : 20,
        padding: compact ? 14 : 18,
      }}
    >
      <div
        style={{
          color: TOKENS.tertiary,
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </div>
      <div
        style={{
          marginTop: 8,
          color: TOKENS.text,
          fontSize: compact ? 22 : 28,
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

function MockBrowserChrome({ title, children }: { title: string; children: ReactNode }) {
  return (
    <>
      <div
        style={{
          height: 40,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 14px",
          borderBottom: `1px solid ${TOKENS.borderSubtle}`,
          background: "rgba(255,255,255,0.025)",
        }}
      >
        <div style={{ display: "flex", gap: 7 }}>
          <span style={{ width: 7, height: 7, borderRadius: 999, background: "rgba(255,255,255,0.22)" }} />
          <span style={{ width: 7, height: 7, borderRadius: 999, background: "rgba(255,255,255,0.14)" }} />
          <span style={{ width: 7, height: 7, borderRadius: 999, background: "rgba(255,255,255,0.08)" }} />
        </div>
        <div style={{ color: TOKENS.tertiary, fontSize: 11, fontWeight: 600 }}>{title}</div>
        <div style={{ width: 40 }} />
      </div>
      <div style={{ padding: 14 }}>{children}</div>
    </>
  );
}

/** Hero: dominant operator frame — tighter crop, stronger depth */
function OperatorHeroMock() {
  return (
    <div
      style={{
        borderRadius: 22,
        border: `1px solid ${TOKENS.border}`,
        background: "rgba(5,8,16,0.94)",
        overflow: "hidden",
        boxShadow: "0 32px 80px rgba(0,0,0,0.55), 0 0 0 1px rgba(124,58,237,0.12), 0 0 120px rgba(124,58,237,0.15)",
      }}
    >
      <MockBrowserChrome title="PulseFill — Recovery">
        <div
          style={{
            background: "var(--pf-card-hero-bg)",
            border: `1px solid ${TOKENS.violetBorder}`,
            borderRadius: 16,
            padding: 14,
            marginBottom: 12,
          }}
        >
          <div
            style={{
              color: TOKENS.tertiary,
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
            }}
          >
            Today&apos;s recovery
          </div>
          <div style={{ display: "grid", gap: 10, marginTop: 10, gridTemplateColumns: "repeat(4, minmax(0,1fr))" }}>
            <MetricTile label="Recovered" value="12" accent compact />
            <MetricTile label="Revenue" value="$1.8K" accent compact />
            <MetricTile label="Awaiting" value="4" compact />
            <MetricTile label="Failed" value="3" compact />
          </div>
        </div>
        <div style={{ display: "grid", gap: 10, gridTemplateColumns: "1fr 1fr" }}>
          <div style={{ borderRadius: 14, border: `1px solid ${TOKENS.borderSubtle}`, background: TOKENS.surface, padding: 12 }}>
            <div style={{ color: TOKENS.text, fontSize: 13, fontWeight: 620 }}>What to work first</div>
            <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
              {[
                ["Work first", "6"],
                ["Manual follow-up", "4"],
              ].map(([label, count]) => (
                <div
                  key={label}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "8px 10px",
                    borderRadius: 12,
                    background: "rgba(255,255,255,0.03)",
                    fontSize: 12,
                    color: TOKENS.text,
                  }}
                >
                  <span>{label}</span>
                  <span style={{ color: TOKENS.cyan, fontWeight: 700 }}>{count}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ borderRadius: 14, border: `1px solid ${TOKENS.borderSubtle}`, background: TOKENS.surface, padding: 12 }}>
            <div style={{ color: TOKENS.text, fontSize: 13, fontWeight: 620 }}>Needs attention</div>
            <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
              {["Botox · awaiting confirm", "Hygiene · delivery failed"].map((t) => (
                <div
                  key={t}
                  style={{
                    padding: "8px 10px",
                    borderRadius: 12,
                    background: "rgba(255,255,255,0.03)",
                    fontSize: 11,
                    color: TOKENS.muted,
                  }}
                >
                  {t}
                </div>
              ))}
            </div>
          </div>
        </div>
      </MockBrowserChrome>
    </div>
  );
}

/** Hero: phone — offer-first, shorter */
function CustomerHeroPhone() {
  return (
    <div
      style={{
        width: 240,
        borderRadius: 32,
        border: `1px solid ${TOKENS.border}`,
        background: "linear-gradient(165deg, rgba(18,26,42,0.98), rgba(8,12,22,0.98))",
        padding: 8,
        boxShadow: "0 28px 70px rgba(0,0,0,0.5), 0 0 60px rgba(34,211,238,0.08)",
      }}
    >
      <div
        style={{
          borderRadius: 26,
          overflow: "hidden",
          border: `1px solid ${TOKENS.borderSubtle}`,
          minHeight: 380,
          padding: 16,
          background: "linear-gradient(180deg, rgba(21,32,51,0.5), rgba(11,18,32,0.92))",
        }}
      >
        <div style={{ color: TOKENS.tertiary, fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase" }}>
          Offer
        </div>
        <div style={{ marginTop: 8, color: TOKENS.text, fontSize: 18, fontWeight: 650, letterSpacing: "-0.03em", lineHeight: 1.1 }}>
          Today at 2:30 PM
        </div>
        <div style={{ marginTop: 6, color: TOKENS.muted, fontSize: 12 }}>Yorkville Clinic</div>
        <div
          style={{
            marginTop: 18,
            borderRadius: 16,
            padding: 14,
            background: "var(--pf-card-hero-bg)",
            border: `1px solid ${TOKENS.cyanBorder}`,
          }}
        >
          <div style={{ color: TOKENS.text, fontSize: 13, fontWeight: 620 }}>Offer available</div>
          <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
            <div style={{ borderRadius: 12, padding: "10px 12px", background: TOKENS.violet, color: "#fff", fontSize: 12, fontWeight: 700, textAlign: "center" }}>
              Claim opening
            </div>
            <div
              style={{
                borderRadius: 12,
                padding: "10px 12px",
                border: `1px solid ${TOKENS.borderSubtle}`,
                color: TOKENS.text,
                fontSize: 12,
                fontWeight: 600,
                textAlign: "center",
              }}
            >
              View detail
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Product payoff: full browser + richer chrome */
function OperatorPayoffMock() {
  return (
    <div
      style={{
        borderRadius: 26,
        border: `1px solid rgba(124,58,237,0.35)`,
        background: "rgba(4,7,14,0.96)",
        overflow: "hidden",
        boxShadow: "0 40px 100px rgba(0,0,0,0.6), 0 0 140px rgba(124,58,237,0.2)",
      }}
    >
      <MockBrowserChrome title="PulseFill — Operator">
        <div
          style={{
            background: "var(--pf-card-hero-bg)",
            border: `1px solid ${TOKENS.violetBorder}`,
            borderRadius: 18,
            padding: 16,
            marginBottom: 14,
          }}
        >
          <div style={{ color: TOKENS.tertiary, fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" }}>
            Today&apos;s recovery
          </div>
          <div style={{ display: "grid", gap: 12, marginTop: 12, gridTemplateColumns: "repeat(4, minmax(0,1fr))" }}>
            <MetricTile label="Recovered" value="12" accent />
            <MetricTile label="Revenue" value="$1.8K" accent />
            <MetricTile label="Awaiting" value="4" />
            <MetricTile label="Failed" value="3" />
          </div>
        </div>
        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr" }}>
          <div style={{ borderRadius: 16, border: `1px solid ${TOKENS.border}`, background: TOKENS.surface, padding: 14 }}>
            <div style={{ color: TOKENS.text, fontSize: 14, fontWeight: 620 }}>What to work first</div>
            <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
              {[
                ["Work first", "6"],
                ["Manual follow-up", "4"],
                ["Improve coverage", "3"],
              ].map(([label, count]) => (
                <div
                  key={label}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "10px 12px",
                    borderRadius: 14,
                    background: "rgba(255,255,255,0.04)",
                    border: `1px solid ${TOKENS.borderSubtle}`,
                    fontSize: 13,
                    color: TOKENS.text,
                  }}
                >
                  <span>{label}</span>
                  <span style={{ color: TOKENS.cyan, fontWeight: 700 }}>{count}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ borderRadius: 16, border: `1px solid ${TOKENS.border}`, background: TOKENS.surface, padding: 14 }}>
            <div style={{ color: TOKENS.text, fontSize: 14, fontWeight: 620 }}>Needs attention now</div>
            <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
              {[
                ["Botox Consult", "Awaiting confirmation"],
                ["Hygiene Visit", "Delivery failed"],
              ].map(([t, reason]) => (
                <div key={t} style={{ borderRadius: 14, padding: 12, background: "rgba(255,255,255,0.04)", border: `1px solid ${TOKENS.borderSubtle}` }}>
                  <div style={{ color: TOKENS.text, fontSize: 13, fontWeight: 620 }}>{t}</div>
                  <div style={{ marginTop: 6, color: TOKENS.muted, fontSize: 12 }}>{reason}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </MockBrowserChrome>
    </div>
  );
}

function CustomerPayoffPhone() {
  return (
    <div
      style={{
        width: "100%",
        maxWidth: 280,
        borderRadius: 36,
        border: `1px solid ${TOKENS.border}`,
        background: "rgba(6,10,18,0.98)",
        padding: 10,
        boxShadow: "0 28px 80px rgba(0,0,0,0.55), 0 0 80px rgba(34,211,238,0.1)",
      }}
    >
      <div
        style={{
          borderRadius: 28,
          overflow: "hidden",
          border: `1px solid ${TOKENS.borderSubtle}`,
          minHeight: 480,
          background: "linear-gradient(180deg, rgba(21,32,51,0.96), rgba(11,18,32,0.96))",
          padding: 18,
        }}
      >
        <div style={{ color: TOKENS.tertiary, fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" }}>Standby</div>
        <div style={{ marginTop: 8, color: TOKENS.text, fontSize: 22, fontWeight: 650, letterSpacing: "-0.03em", lineHeight: 1.05 }}>
          Matched openings, fast.
        </div>
        <p style={{ marginTop: 10, color: TOKENS.muted, fontSize: 13, lineHeight: 1.65 }}>
          Preferences, offers, and status — so customers can act in minutes.
        </p>
        <div style={{ marginTop: 20, display: "grid", gap: 10 }}>
          <div
            style={{
              borderRadius: 18,
              padding: 14,
              background: "var(--pf-card-hero-bg)",
              border: `1px solid ${TOKENS.cyanBorder}`,
            }}
          >
            <div style={{ color: TOKENS.text, fontSize: 14, fontWeight: 620 }}>Offer available</div>
            <div style={{ marginTop: 6, color: TOKENS.muted, fontSize: 12 }}>Today · 2:30 PM</div>
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <div style={{ flex: 1, borderRadius: 12, padding: "10px", background: TOKENS.violet, color: "#fff", fontSize: 12, fontWeight: 700, textAlign: "center" }}>
                Claim
              </div>
              <div style={{ flex: 1, borderRadius: 12, padding: "10px", border: `1px solid ${TOKENS.borderSubtle}`, fontSize: 12, fontWeight: 600, textAlign: "center" }}>
                Detail
              </div>
            </div>
          </div>
          {["Preferences set", "Standby active"].map((item) => (
            <div key={item} style={{ borderRadius: 14, padding: 12, background: "rgba(255,255,255,0.04)", border: `1px solid ${TOKENS.borderSubtle}`, fontSize: 12, color: TOKENS.text }}>
              {item}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const STEPS: { step: string; title: string; body: string }[] = [
  { step: "1", title: "A slot opens", body: "Near-term cancellation creates a recovery window." },
  { step: "2", title: "Standby is matched", body: "Rules + preferences surface the right customers." },
  { step: "3", title: "Operators triage", body: "Queue, retry, confirm — with clear reasons." },
  { step: "4", title: "Recoveries land", body: "Bookings and revenue show up where the team works." },
];

export function PulseFillLandingPage() {
  const demoHref = "mailto:hello@pulsefill.com?subject=PulseFill%20demo";
  const workflowHref = "/login";

  const mainBg: CSSProperties = {
    minHeight: "100vh",
    color: TOKENS.text,
    background: `
      radial-gradient(ellipse 90% 55% at 78% 18%, rgba(124,58,237,0.28), transparent 50%),
      radial-gradient(ellipse 70% 45% at 12% 22%, rgba(34,211,238,0.08), transparent 45%),
      radial-gradient(ellipse 120% 80% at 50% 0%, rgba(0,0,0,0.35), transparent 55%),
      var(--pf-shell-bg)
    `,
  };

  return (
    <main style={mainBg}>
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 30,
          backdropFilter: "blur(16px) saturate(1.2)",
          background: "rgba(5,8,14,0.78)",
          borderBottom: `1px solid ${TOKENS.borderSubtle}`,
        }}
      >
        <Container
          style={{
            minHeight: 72,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            flexWrap: "wrap",
            paddingTop: 10,
            paddingBottom: 10,
          }}
        >
          <div style={{ color: TOKENS.text, fontSize: 17, fontWeight: 700, letterSpacing: "-0.03em" }}>PulseFill</div>
          <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" }}>
            <NavAnchor href="#how-it-works">How it works</NavAnchor>
            <NavAnchor href="#product">Product</NavAnchor>
            <SecondaryButton href={workflowHref}>Sign in</SecondaryButton>
            <PrimaryButton href={demoHref}>Book a demo</PrimaryButton>
          </div>
        </Container>
      </header>

      {/* —— Hero: cinematic —— */}
      <section
        style={{
          position: "relative",
          padding: "clamp(56px, 10vw, 112px) 0 clamp(48px, 8vw, 88px)",
          overflow: "hidden",
        }}
      >
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            background: "radial-gradient(circle at 0% 50%, rgba(0,0,0,0.45), transparent 42%)",
            pointerEvents: "none",
          }}
        />
        <Container style={{ position: "relative", zIndex: 1 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))",
              gap: "clamp(32px, 5vw, 56px)",
              alignItems: "center",
            }}
          >
            <div style={{ maxWidth: 440 }}>
              <HeroEyebrow>Appointment recovery operating system</HeroEyebrow>
              <h1
                style={{
                  margin: "16px 0 0 0",
                  color: TOKENS.text,
                  fontSize: "clamp(38px, 5.2vw, 64px)",
                  lineHeight: 0.98,
                  letterSpacing: "-0.055em",
                  fontWeight: 680,
                }}
              >
                <span style={{ display: "block" }}>Recover same-day</span>
                <span style={{ display: "block" }}>cancellations before</span>
                <span style={{ display: "block" }}>they become lost</span>
                <span style={{ display: "block" }}>revenue.</span>
              </h1>
              <p
                style={{
                  margin: "22px 0 0 0",
                  color: TOKENS.muted,
                  fontSize: 16,
                  lineHeight: 1.65,
                  maxWidth: 400,
                }}
              >
                Recover near-term openings with a two-sided standby system, a clear operator workflow, and rules-based
                prioritization teams can trust.
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "18px 22px", marginTop: 26 }}>
                <PrimaryButton href={demoHref}>Book a demo</PrimaryButton>
                <TextLink href={workflowHref}>See operator workflow</TextLink>
              </div>
              <p style={{ marginTop: 20, color: TOKENS.tertiary, fontSize: 12, lineHeight: 1.6, maxWidth: 380 }}>
                For clinics and appointment teams where schedule change is constant.
              </p>
            </div>

            <div
              style={{
                position: "relative",
                minHeight: 420,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {/* Focal bloom */}
              <div
                aria-hidden
                style={{
                  position: "absolute",
                  width: "min(120%, 720px)",
                  height: "min(100%, 520px)",
                  left: "50%",
                  top: "52%",
                  transform: "translate(-50%, -50%)",
                  background: "radial-gradient(circle, rgba(124,58,237,0.35) 0%, rgba(34,211,238,0.06) 45%, transparent 70%)",
                  filter: "blur(48px)",
                  opacity: 0.85,
                  pointerEvents: "none",
                }}
              />
              {/* Cyan edge */}
              <div
                aria-hidden
                style={{
                  position: "absolute",
                  right: "4%",
                  bottom: "8%",
                  width: 200,
                  height: 280,
                  borderRadius: "50%",
                  background: "radial-gradient(circle, rgba(34,211,238,0.18), transparent 70%)",
                  filter: "blur(32px)",
                  pointerEvents: "none",
                }}
              />

              <div style={{ position: "relative", width: "100%", maxWidth: 560 }}>
                <div
                  style={{
                    transform: "rotate(-1.5deg) scale(1.02)",
                    transformOrigin: "center center",
                  }}
                >
                  <OperatorHeroMock />
                </div>

                {/* Floating micro-card */}
                <div
                  style={{
                    position: "absolute",
                    top: "8%",
                    left: "-4%",
                    zIndex: 4,
                    padding: "12px 14px",
                    borderRadius: 14,
                    border: `1px solid ${TOKENS.borderSubtle}`,
                    background: "rgba(8,12,22,0.92)",
                    backdropFilter: "blur(10px)",
                    boxShadow: "0 16px 40px rgba(0,0,0,0.45)",
                  }}
                >
                  <div style={{ fontSize: 10, color: TOKENS.tertiary, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" }}>
                    Digest
                  </div>
                  <div style={{ marginTop: 6, color: TOKENS.text, fontSize: 13, fontWeight: 600 }}>Work first · 6</div>
                  <div style={{ marginTop: 4, color: TOKENS.muted, fontSize: 11 }}>Start here this morning</div>
                </div>

                <div
                  style={{
                    position: "absolute",
                    right: "-6%",
                    bottom: "-8%",
                    zIndex: 5,
                    transform: "rotate(5deg)",
                  }}
                >
                  <CustomerHeroPhone />
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Proof strip — lighter */}
      <section style={{ padding: "0 0 40px" }}>
        <Container>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "12px 28px",
              justifyContent: "space-between",
              color: TOKENS.tertiary,
              fontSize: 11,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              paddingTop: 24,
              borderTop: `1px solid rgba(255,255,255,0.06)`,
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

      {/* —— Problem: editorial —— */}
      <section id="problem" style={{ padding: "clamp(72px, 10vw, 120px) 0" }}>
        <Container>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 300px), 1fr))",
              gap: "clamp(32px, 6vw, 72px)",
              alignItems: "start",
            }}
          >
            <div style={{ maxWidth: 520 }}>
              <div style={{ color: TOKENS.tertiary, fontSize: 11, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase" }}>
                The problem
              </div>
              <h2
                style={{
                  margin: "14px 0 0 0",
                  color: TOKENS.text,
                  fontSize: "clamp(26px, 3.2vw, 36px)",
                  fontWeight: 620,
                  letterSpacing: "-0.035em",
                  lineHeight: 1.12,
                }}
              >
                Empty openings compound into lost revenue, broken rhythm, and manual chaos.
              </h2>
              <p style={{ margin: "18px 0 0 0", color: TOKENS.muted, fontSize: 16, lineHeight: 1.75, maxWidth: 480 }}>
                Close-in cancellations force teams across calls, texts, and memory. Openings expire fast — and most
                scheduling tools never run a real recovery workflow.
              </p>
            </div>
            <div style={{ display: "grid", gap: 0 }}>
              {[
                {
                  t: "Manual follow-up burns staff time",
                  d: "Ad hoc messages, callbacks, and spreadsheets replace a system.",
                },
                {
                  t: "Near-term windows vanish",
                  d: "Every minute of delay costs more the closer you get to appointment time.",
                },
                {
                  t: "Tools stop at the calendar",
                  d: "They store appointments — they don’t actively recover cancellations.",
                },
              ].map((row, i) => (
                <div
                  key={row.t}
                  style={{
                    padding: "22px 0 22px 20px",
                    borderLeft: `2px solid ${i === 0 ? TOKENS.violet : TOKENS.borderSubtle}`,
                    borderBottom: i < 2 ? `1px solid rgba(255,255,255,0.06)` : "none",
                  }}
                >
                  <div style={{ color: TOKENS.text, fontSize: 17, fontWeight: 600, letterSpacing: "-0.02em" }}>{row.t}</div>
                  <p style={{ margin: "8px 0 0 0", color: TOKENS.muted, fontSize: 14, lineHeight: 1.65 }}>{row.d}</p>
                </div>
              ))}
              <div
                style={{
                  marginTop: 28,
                  padding: "16px 18px",
                  borderRadius: 16,
                  background: "rgba(124,58,237,0.08)",
                  border: `1px solid rgba(124,58,237,0.22)`,
                }}
              >
                <div style={{ color: TOKENS.tertiary, fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase" }}>
                  What teams lack
                </div>
                <div style={{ marginTop: 8, color: TOKENS.text, fontSize: 20, fontWeight: 650 }}>Visibility into why recovery stalls</div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* —— How it works: process strip —— */}
      <section id="how-it-works" style={{ padding: "clamp(64px, 9vw, 100px) 0", background: "rgba(0,0,0,0.18)" }}>
        <Container>
          <div style={{ maxWidth: 640, marginBottom: 28 }}>
            <div style={{ color: TOKENS.tertiary, fontSize: 11, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase" }}>
              How it works
            </div>
            <h2
              style={{
                margin: "12px 0 0 0",
                color: TOKENS.text,
                fontSize: "clamp(26px, 3vw, 34px)",
                fontWeight: 620,
                letterSpacing: "-0.035em",
                lineHeight: 1.1,
              }}
            >
              Cancellations → matches → triage → recovered bookings
            </h2>
          </div>

          <div style={{ position: "relative" }}>
            <div
              aria-hidden
              style={{
                position: "absolute",
                left: "6%",
                right: "6%",
                top: 18,
                height: 1,
                background: "linear-gradient(90deg, transparent, rgba(124,58,237,0.35), rgba(34,211,238,0.25), transparent)",
                pointerEvents: "none",
              }}
            />
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 200px), 1fr))",
                gap: 16,
                alignItems: "stretch",
              }}
            >
              {STEPS.map(({ step, title, body }) => (
                <div key={step} style={{ paddingTop: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 999,
                        display: "grid",
                        placeItems: "center",
                        fontSize: 12,
                        fontWeight: 700,
                        color: TOKENS.text,
                        background: "rgba(124,58,237,0.15)",
                        border: `1px solid ${TOKENS.violetBorder}`,
                        flexShrink: 0,
                      }}
                    >
                      {step}
                    </div>
                    <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)", minWidth: 12 }} />
                  </div>
                  <div
                    style={{
                      borderRadius: 18,
                      padding: "16px 16px 18px",
                      background: "rgba(255,255,255,0.02)",
                      border: `1px solid rgba(255,255,255,0.06)`,
                    }}
                  >
                    <div style={{ color: TOKENS.text, fontSize: 15, fontWeight: 620, lineHeight: 1.25 }}>{title}</div>
                    <p style={{ margin: "10px 0 0 0", color: TOKENS.muted, fontSize: 13, lineHeight: 1.6 }}>{body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </section>

      {/* —— Product: payoff —— */}
      <section
        id="product"
        style={{
          position: "relative",
          padding: "clamp(80px, 12vw, 140px) 0",
          overflow: "hidden",
        }}
      >
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: "10% -20%",
            background: "radial-gradient(ellipse at 60% 40%, rgba(124,58,237,0.22), transparent 55%)",
            pointerEvents: "none",
          }}
        />
        <Container style={{ position: "relative", zIndex: 1 }}>
          <div style={{ maxWidth: 720, marginBottom: "clamp(36px, 6vw, 56px)" }}>
            <div style={{ color: TOKENS.tertiary, fontSize: 11, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase" }}>
              Product surfaces
            </div>
            <h2
              style={{
                margin: "12px 0 0 0",
                color: TOKENS.text,
                fontSize: "clamp(30px, 4vw, 48px)",
                fontWeight: 620,
                letterSpacing: "-0.04em",
                lineHeight: 1.05,
              }}
            >
              One recovery console. One standby experience.
            </h2>
            <p style={{ margin: "16px 0 0 0", color: TOKENS.muted, fontSize: 17, lineHeight: 1.65, maxWidth: 560 }}>
              Operators run the workflow; customers respond to real openings — composed as one product story.
            </p>
          </div>

          <div
            style={{
              position: "relative",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 300px), 1fr))",
              gap: "clamp(24px, 4vw, 40px)",
              alignItems: "end",
            }}
          >
            <div style={{ position: "relative", zIndex: 2 }}>
              <OperatorPayoffMock />
            </div>
            <div
              style={{
                position: "relative",
                zIndex: 3,
                justifySelf: "center",
                marginTop: "clamp(0px, 2vw, 0px)",
                transform: "translateY(clamp(12px, 4vw, 40px))",
              }}
            >
              <CustomerPayoffPhone />
            </div>
          </div>
        </Container>
      </section>

      {/* —— Model: minimal split —— */}
      <section id="model" style={{ padding: "clamp(72px, 10vw, 120px) 0" }}>
        <Container>
          <div style={{ maxWidth: 680, marginBottom: 40 }}>
            <div style={{ color: TOKENS.tertiary, fontSize: 11, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase" }}>
              The model
            </div>
            <h2
              style={{
                margin: "12px 0 0 0",
                color: TOKENS.text,
                fontSize: "clamp(26px, 3.2vw, 38px)",
                fontWeight: 620,
                letterSpacing: "-0.035em",
                lineHeight: 1.1,
              }}
            >
              Two-sided standby built for recovery
            </h2>
            <p style={{ margin: "14px 0 0 0", color: TOKENS.muted, fontSize: 16, lineHeight: 1.65 }}>
              Demand on the customer side meets execution on the operator side — one system.
            </p>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))",
              gap: "clamp(24px, 5vw, 48px)",
            }}
          >
            {[
              {
                label: "Customer",
                color: TOKENS.cyan,
                title: "Join standby",
                bullets: ["Preferences", "Matched openings", "Fast claim"],
              },
              {
                label: "Operator",
                color: TOKENS.violet,
                title: "Run recovery",
                bullets: ["Action queue", "Slot context", "Confirm & retry"],
              },
            ].map((col) => (
              <div key={col.label}>
                <div style={{ color: col.color, fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>{col.label}</div>
                <h3 style={{ margin: "10px 0 0 0", fontSize: 22, fontWeight: 620, letterSpacing: "-0.03em" }}>{col.title}</h3>
                <ul style={{ margin: "16px 0 0 0", padding: 0, listStyle: "none", display: "grid", gap: 12 }}>
                  {col.bullets.map((b) => (
                    <li key={b} style={{ color: TOKENS.muted, fontSize: 15, lineHeight: 1.5, paddingLeft: 16, position: "relative" }}>
                      <span
                        style={{
                          position: "absolute",
                          left: 0,
                          top: "0.55em",
                          width: 6,
                          height: 1,
                          background: TOKENS.borderSubtle,
                        }}
                      />
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* —— Why: statements —— */}
      <section id="why" style={{ padding: "clamp(64px, 9vw, 100px) 0", borderTop: `1px solid rgba(255,255,255,0.06)` }}>
        <Container>
          <div style={{ textAlign: "center", maxWidth: 640, margin: "0 auto 48px" }}>
            <div style={{ color: TOKENS.tertiary, fontSize: 11, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase" }}>
              Why PulseFill
            </div>
            <h2
              style={{
                margin: "12px 0 0 0",
                color: TOKENS.text,
                fontSize: "clamp(24px, 3vw, 34px)",
                fontWeight: 620,
                letterSpacing: "-0.035em",
                lineHeight: 1.12,
              }}
            >
              More than reminders. More than scheduling.
            </h2>
          </div>
          <div style={{ display: "grid", gap: 0 }}>
            {[
              {
                title: "Built for near-term recovery",
                body: "Same-day and short-window cancellations — where speed and clarity decide outcomes.",
              },
              {
                title: "Rules-based and explainable",
                body: "Queue reasons and actions your team can read — not black-box automation theater.",
              },
              {
                title: "One product across both sides",
                body: "Standby demand and operator execution share one spine — B2B2C by design.",
              },
            ].map((row, i) => (
              <div
                key={row.title}
                style={{
                  padding: "28px 0",
                  borderTop: i === 0 ? `1px solid rgba(255,255,255,0.08)` : undefined,
                  borderBottom: `1px solid rgba(255,255,255,0.08)`,
                }}
              >
                <div style={{ color: TOKENS.text, fontSize: "clamp(18px, 2.2vw, 22px)", fontWeight: 620, letterSpacing: "-0.02em" }}>{row.title}</div>
                <p style={{ margin: "10px 0 0 0", color: TOKENS.muted, fontSize: 15, lineHeight: 1.65, maxWidth: 720 }}>{row.body}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* —— Value: dominant metrics —— */}
      <section id="value" style={{ padding: "clamp(64px, 9vw, 100px) 0" }}>
        <Container>
          <div style={{ maxWidth: 560, marginBottom: 32 }}>
            <div style={{ color: TOKENS.tertiary, fontSize: 11, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase" }}>
              Outcomes
            </div>
            <h2
              style={{
                margin: "12px 0 0 0",
                color: TOKENS.text,
                fontSize: "clamp(26px, 3.2vw, 34px)",
                fontWeight: 620,
                letterSpacing: "-0.035em",
              }}
            >
              What teams track with PulseFill
            </h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 240px), 1fr))", gap: 16 }}>
            <div
              style={{
                borderRadius: 22,
                padding: 28,
                background: "var(--pf-card-hero-bg)",
                border: `1px solid ${TOKENS.violetBorder}`,
                boxShadow: "0 20px 50px rgba(124,58,237,0.12)",
              }}
            >
              <div style={{ color: TOKENS.tertiary, fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" }}>Recovered bookings</div>
              <div style={{ marginTop: 12, fontSize: 44, fontWeight: 650, letterSpacing: "-0.04em" }}>12</div>
              <p style={{ margin: "12px 0 0 0", color: TOKENS.muted, fontSize: 14, lineHeight: 1.6 }}>Illustrative — replace with your live recovery feed.</p>
            </div>
            <div
              style={{
                borderRadius: 22,
                padding: 28,
                background: "rgba(255,255,255,0.03)",
                border: `1px solid ${TOKENS.cyanBorder}`,
                boxShadow: "0 20px 50px rgba(34,211,238,0.08)",
              }}
            >
              <div style={{ color: TOKENS.tertiary, fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" }}>Recovered revenue</div>
              <div style={{ marginTop: 12, fontSize: 44, fontWeight: 650, letterSpacing: "-0.04em" }}>$1.8K</div>
              <p style={{ margin: "12px 0 0 0", color: TOKENS.muted, fontSize: 14, lineHeight: 1.6 }}>Tie recovery to revenue the desk already understands.</p>
            </div>
          </div>
          <div
            style={{
              marginTop: 16,
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 160px), 1fr))",
              gap: 12,
            }}
          >
            {[
              ["Fill-rate visibility", "Live"],
              ["Workflow clarity", "High"],
              ["Manual chaos", "Down"],
            ].map(([k, v]) => (
              <div key={k} style={{ padding: "16px 18px", borderRadius: 16, border: `1px solid ${TOKENS.borderSubtle}`, background: "rgba(255,255,255,0.02)" }}>
                <div style={{ fontSize: 10, color: TOKENS.tertiary, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" }}>{k}</div>
                <div style={{ marginTop: 8, fontSize: 18, fontWeight: 600 }}>{v}</div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* —— Trust: spacious editorial —— */}
      <section id="trust" style={{ padding: "clamp(80px, 11vw, 130px) 0 clamp(64px, 8vw, 96px)" }}>
        <Container>
          <div style={{ maxWidth: 620 }}>
            <div style={{ color: TOKENS.tertiary, fontSize: 11, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase" }}>
              Trust
            </div>
            <h2
              style={{
                margin: "14px 0 0 0",
                color: TOKENS.text,
                fontSize: "clamp(26px, 3.2vw, 36px)",
                fontWeight: 620,
                letterSpacing: "-0.035em",
                lineHeight: 1.12,
              }}
            >
              Understandable, controllable, real
            </h2>
            <p style={{ margin: "20px 0 0 0", color: TOKENS.muted, fontSize: 17, lineHeight: 1.75 }}>
              Clear recovery logic: what needs attention, what can wait, what failed to deliver, what needs confirmation,
              and where standby coverage is thin.
            </p>
          </div>
          <div
            style={{
              marginTop: 40,
              display: "flex",
              flexWrap: "wrap",
              gap: "12px 20px",
              maxWidth: 900,
            }}
          >
            {["Clear queue reasons", "Explicit operator actions", "Delivery visibility", "Workflow breakdowns"].map((item) => (
              <span
                key={item}
                style={{
                  fontSize: 14,
                  color: TOKENS.text,
                  padding: "10px 0",
                  borderBottom: `1px solid rgba(255,255,255,0.12)`,
                }}
              >
                {item}
              </span>
            ))}
          </div>
        </Container>
      </section>

      {/* —— Final CTA: poster close —— */}
      <section style={{ padding: "clamp(72px, 12vw, 140px) 0 clamp(80px, 12vw, 140px)" }}>
        <Container>
          <div
            style={{
              position: "relative",
              textAlign: "center",
              padding: "clamp(48px, 8vw, 88px) clamp(24px, 5vw, 48px)",
              borderRadius: 28,
              overflow: "hidden",
            }}
          >
            <div
              aria-hidden
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "radial-gradient(ellipse 80% 70% at 50% 20%, rgba(124,58,237,0.25), transparent 55%), radial-gradient(ellipse 60% 50% at 80% 100%, rgba(34,211,238,0.12), transparent 50%), rgba(5,8,14,0.6)",
              }}
            />
            <div style={{ position: "relative", zIndex: 1, maxWidth: 720, margin: "0 auto" }}>
              <h2
                style={{
                  margin: 0,
                  color: TOKENS.text,
                  fontSize: "clamp(28px, 4.2vw, 46px)",
                  lineHeight: 1.05,
                  letterSpacing: "-0.04em",
                  fontWeight: 620,
                }}
              >
                Run cancellation recovery like an operating system — not a scramble.
              </h2>
              <p style={{ margin: "20px auto 0", color: TOKENS.muted, fontSize: 16, lineHeight: 1.65, maxWidth: 520 }}>
                Near-term openings become recovered bookings — two-sided standby, operator workflow, explainable rules.
              </p>
              <div style={{ marginTop: 36, display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "20px 28px", alignItems: "center" }}>
                <PrimaryButton href={demoHref}>Book a demo</PrimaryButton>
                <TextLink href={workflowHref}>Operator sign in</TextLink>
              </div>
            </div>
          </div>
        </Container>
      </section>

      <footer
        style={{
          borderTop: `1px solid ${TOKENS.borderSubtle}`,
          padding: "36px 0 56px",
          color: TOKENS.muted,
          fontSize: 13,
        }}
      >
        <Container style={{ display: "flex", flexWrap: "wrap", gap: 16, justifyContent: "space-between", alignItems: "center" }}>
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
