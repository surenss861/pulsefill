"use client";

import Link from "next/link";
import { Fragment, type CSSProperties, type ReactNode } from "react";

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
  maxWidth: 1120,
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

/** Quieter secondary for closing CTA */
function MutedTextLink({ children, href }: { children: ReactNode; href: string }) {
  return (
    <Link
      href={href}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        fontSize: 13,
        fontWeight: 500,
        color: "rgba(148,163,184,0.88)",
        textDecoration: "none",
        padding: "10px 0",
      }}
    >
      {children}
      <span style={{ opacity: 0.55 }} aria-hidden>
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
    <div style={{ marginBottom: 2 }}>
      <span
        style={{
          display: "inline-block",
          color: "rgba(226,232,240,0.72)",
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          paddingBottom: 5,
          borderBottom: `1px solid rgba(148,163,184,0.35)`,
        }}
      >
        {children}
      </span>
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
          minHeight: 440,
          background: "linear-gradient(180deg, rgba(21,32,51,0.96), rgba(11,18,32,0.96))",
          padding: 18,
        }}
      >
        <div style={{ color: TOKENS.tertiary, fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>Standby</div>
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
  {
    step: "1",
    title: "A slot opens",
    body: "A near-term cancellation creates a revenue risk and a short recovery window.",
  },
  {
    step: "2",
    title: "Standby demand is matched",
    body: "Preferences, availability, and recovery logic surface the right customers.",
  },
  {
    step: "3",
    title: "Operators are guided",
    body: "Teams queue, retry, confirm, or follow up with clear reasons and the right context.",
  },
  {
    step: "4",
    title: "Recovery becomes visible",
    body: "Recovered bookings and recovered revenue show up where the team works.",
  },
];

export function PulseFillLandingPage() {
  const demoHref = "mailto:hello@pulsefill.com?subject=PulseFill%20demo";
  const workflowHref = "/login";

  const mainBg: CSSProperties = {
    minHeight: "100vh",
    overflowX: "hidden",
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
          overflow: "visible",
        }}
      >
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            background: `
              radial-gradient(ellipse 55% 70% at 38% 48%, rgba(124,58,237,0.14), transparent 55%),
              radial-gradient(circle at 0% 50%, rgba(0,0,0,0.42), transparent 42%)
            `,
            pointerEvents: "none",
          }}
        />
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0.04,
            backgroundImage: "repeating-linear-gradient(90deg, transparent, transparent 1px, rgba(255,255,255,0.06) 1px, rgba(255,255,255,0.06) 2px)",
            pointerEvents: "none",
          }}
        />
        <Container style={{ position: "relative", zIndex: 1 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 300px), 1fr))",
              columnGap: "clamp(16px, 3vw, 36px)",
              rowGap: "clamp(28px, 4vw, 40px)",
              alignItems: "center",
            }}
          >
            <div style={{ maxWidth: 430 }}>
              <HeroEyebrow>Appointment recovery infrastructure</HeroEyebrow>
              <h1
                style={{
                  margin: "10px 0 0 0",
                  color: TOKENS.text,
                  fontSize: "clamp(34px, 4.8vw, 58px)",
                  lineHeight: 0.98,
                  letterSpacing: "-0.052em",
                  fontWeight: 680,
                  maxWidth: 420,
                }}
              >
                <span style={{ display: "block" }}>The missing layer</span>
                <span style={{ display: "block" }}>between cancellations</span>
                <span style={{ display: "block" }}>and recovered bookings.</span>
              </h1>
              <p
                style={{
                  margin: "18px 0 0 0",
                  color: TOKENS.muted,
                  fontSize: 16,
                  lineHeight: 1.62,
                  maxWidth: 400,
                }}
              >
                PulseFill gives appointment businesses a real recovery system — matching standby demand, guiding operator
                action, and turning near-term openings into measurable revenue recovery.
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", gap: "12px 20px", marginTop: 18 }}>
                <PrimaryButton href={demoHref}>Book a demo</PrimaryButton>
                <TextLink href="#how-it-works">See the recovery workflow</TextLink>
              </div>
              <p style={{ marginTop: 16, color: TOKENS.tertiary, fontSize: 12, lineHeight: 1.55, maxWidth: 400 }}>
                Built for teams where cancellations happen fast and revenue windows close faster.
              </p>
            </div>

            <div
              style={{
                position: "relative",
                minHeight: 400,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transform: "translateX(clamp(-8px, -3vw, -72px))",
              }}
            >
              {/* Focal bloom — bleeds toward headline */}
              <div
                aria-hidden
                style={{
                  position: "absolute",
                  width: "min(118%, 700px)",
                  height: "min(105%, 520px)",
                  left: "46%",
                  top: "46%",
                  transform: "translate(-50%, -50%)",
                  background:
                    "radial-gradient(circle, rgba(124,58,237,0.48) 0%, rgba(124,58,237,0.16) 42%, rgba(34,211,238,0.05) 58%, transparent 74%)",
                  filter: "blur(48px)",
                  opacity: 0.92,
                  pointerEvents: "none",
                }}
              />
              <div
                aria-hidden
                style={{
                  position: "absolute",
                  right: "0%",
                  bottom: "0%",
                  width: 200,
                  height: 260,
                  borderRadius: "50%",
                  background: "radial-gradient(circle, rgba(34,211,238,0.16), transparent 72%)",
                  filter: "blur(34px)",
                  pointerEvents: "none",
                }}
              />

              <div style={{ position: "relative", width: "100%", maxWidth: 620 }}>
                <div
                  style={{
                    transform: "rotate(-0.85deg) scale(1.165)",
                    transformOrigin: "center center",
                    filter: "drop-shadow(0 28px 50px rgba(0,0,0,0.55))",
                  }}
                >
                  <OperatorHeroMock />
                </div>

                <div
                  style={{
                    position: "absolute",
                    top: "7%",
                    left: "2%",
                    zIndex: 4,
                    padding: "8px 10px",
                    borderRadius: 11,
                    border: `1px solid ${TOKENS.borderSubtle}`,
                    background: "rgba(5,8,16,0.96)",
                    backdropFilter: "blur(12px)",
                    boxShadow: "0 12px 32px rgba(0,0,0,0.55)",
                    transform: "scale(0.88)",
                  }}
                >
                  <div style={{ fontSize: 8, color: TOKENS.tertiary, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase" }}>
                    Digest
                  </div>
                  <div style={{ marginTop: 4, color: TOKENS.text, fontSize: 11, fontWeight: 600 }}>Work first · 6</div>
                  <div style={{ marginTop: 2, color: TOKENS.muted, fontSize: 9 }}>Start here this morning</div>
                </div>

                <div
                  style={{
                    position: "absolute",
                    right: "clamp(-4px, -0.5vw, 8px)",
                    bottom: "clamp(-4px, 0.5vw, 16px)",
                    zIndex: 5,
                    filter: "drop-shadow(0 22px 36px rgba(0,0,0,0.65))",
                    transform: "rotate(2.5deg) translateY(10px) translateX(8px) scale(0.9)",
                  }}
                >
                  <CustomerHeroPhone />
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* —— Broken workflow —— */}
      <section id="broken-workflow" style={{ padding: "clamp(72px, 10vw, 120px) 0" }}>
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
                  margin: "12px 0 0 0",
                  color: TOKENS.text,
                  fontSize: "clamp(26px, 3.2vw, 38px)",
                  fontWeight: 620,
                  letterSpacing: "-0.035em",
                  lineHeight: 1.1,
                }}
              >
                Most teams still handle cancellations with a scramble.
              </h2>
              <p style={{ margin: "14px 0 0 0", color: TOKENS.muted, fontSize: 16, lineHeight: 1.72, maxWidth: 480 }}>
                When a near-term appointment falls out of the schedule, recovery usually depends on calls, texts, memory,
                ad hoc lists, and whoever notices first. Openings expire fast. Staff time gets burned. And most teams still
                can&apos;t see why a slot was lost.
              </p>
            </div>
            <div style={{ display: "grid", gap: 0, maxWidth: 420, justifySelf: "stretch" }}>
              {[
                {
                  t: "Openings expire fast",
                  d: "Close-in cancellations create short recovery windows, where every minute of delay lowers the odds of filling the slot.",
                },
                {
                  t: "Manual follow-up doesn't scale",
                  d: "The front desk becomes the workflow — juggling callbacks, messages, and guesswork instead of running a system.",
                },
                {
                  t: "Most tools stop at the calendar",
                  d: "They store appointments, but they don't actively run recovery when the schedule breaks.",
                },
              ].map((row, i) => (
                <div
                  key={row.t}
                  style={{
                    padding: "20px 0 20px 18px",
                    borderLeft: `2px solid ${i === 0 ? TOKENS.violet : TOKENS.borderSubtle}`,
                    borderBottom: i < 2 ? `1px solid rgba(255,255,255,0.06)` : "none",
                    boxShadow: i === 0 ? "-8px 0 28px rgba(124,58,237,0.12)" : undefined,
                  }}
                >
                  <div style={{ color: TOKENS.text, fontSize: 17, fontWeight: i === 0 ? 650 : 600, letterSpacing: "-0.02em" }}>{row.t}</div>
                  <p style={{ margin: "10px 0 0 0", color: TOKENS.muted, fontSize: 14, lineHeight: 1.62 }}>{row.d}</p>
                </div>
              ))}
              <div
                style={{
                  marginTop: 24,
                  padding: "18px 20px",
                  borderRadius: 18,
                  background: "rgba(6,4,18,0.85)",
                  border: `1px solid rgba(124,58,237,0.45)`,
                  boxShadow: "0 0 0 1px rgba(124,58,237,0.12), 0 20px 50px rgba(124,58,237,0.18)",
                }}
              >
                <div style={{ color: TOKENS.tertiary, fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase" }}>
                  What teams actually lack
                </div>
                <div style={{ marginTop: 10, color: TOKENS.text, fontSize: 22, fontWeight: 650, letterSpacing: "-0.03em", lineHeight: 1.15 }}>
                  Visibility into why recovery stalls
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* —— Missing operational layer —— */}
      <section id="missing-layer" style={{ padding: "clamp(64px, 9vw, 100px) 0", background: "rgba(0,0,0,0.22)" }}>
        <Container>
          <div style={{ maxWidth: 720, marginBottom: 36 }}>
            <div style={{ color: TOKENS.tertiary, fontSize: 11, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase" }}>
              The missing layer
            </div>
            <h2
              style={{
                margin: "12px 0 0 0",
                color: TOKENS.text,
                fontSize: "clamp(26px, 3.2vw, 38px)",
                fontWeight: 620,
                letterSpacing: "-0.035em",
                lineHeight: 1.08,
              }}
            >
              PulseFill turns disruption into a workflow.
            </h2>
            <p style={{ margin: "14px 0 0 0", color: TOKENS.muted, fontSize: 16, lineHeight: 1.72, maxWidth: 600 }}>
              Instead of reacting to cancellations manually, your team gets a system: surface the right standby demand,
              queue the right action, confirm recoveries quickly, and track what was saved.
            </p>
          </div>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "stretch",
              gap: 12,
            }}
          >
            {[
              { k: "Cancellation", t: "A near-term opening appears.", accent: TOKENS.borderSubtle },
              { k: "Recovery logic", t: "PulseFill matches demand and guides action.", accent: TOKENS.violetBorder },
              { k: "Recovered outcome", t: "Bookings and revenue return to the schedule.", accent: TOKENS.cyanBorder },
            ].map((block, i) => (
              <Fragment key={block.k}>
                {i > 0 ? (
                  <div
                    style={{
                      display: "grid",
                      placeItems: "center",
                      color: TOKENS.tertiary,
                      fontSize: 18,
                      minWidth: 28,
                      flexShrink: 0,
                    }}
                  >
                    →
                  </div>
                ) : null}
                <div
                  style={{
                    flex: "1 1 200px",
                    minWidth: 200,
                    borderRadius: 18,
                    padding: "20px 18px",
                    border: `1px solid ${block.accent}`,
                    background: "rgba(255,255,255,0.03)",
                  }}
                >
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: TOKENS.tertiary }}>
                    {block.k}
                  </div>
                  <p style={{ margin: "10px 0 0 0", color: TOKENS.text, fontSize: 15, lineHeight: 1.55, fontWeight: 600 }}>{block.t}</p>
                </div>
              </Fragment>
            ))}
          </div>
          <p style={{ marginTop: 24, color: TOKENS.muted, fontSize: 14, lineHeight: 1.65, maxWidth: 640 }}>
            From schedule disruption to measurable recovery — in one operational flow.
          </p>
        </Container>
      </section>

      {/* —— How it works: process strip —— */}
      <section id="how-it-works" style={{ padding: "clamp(64px, 9vw, 100px) 0", background: "rgba(0,0,0,0.18)" }}>
        <Container>
          <div style={{ maxWidth: 680, marginBottom: 28 }}>
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
              From open slot to recovered booking
            </h2>
            <p style={{ margin: "12px 0 0 0", color: TOKENS.muted, fontSize: 15, lineHeight: 1.65, maxWidth: 560 }}>
              PulseFill connects standby demand, operator action, and recovered outcomes in one workflow.
            </p>
          </div>

          <div style={{ position: "relative" }}>
            <div
              aria-hidden
              style={{
                position: "absolute",
                left: "4%",
                right: "4%",
                top: 16,
                height: 2,
                borderRadius: 2,
                background: "linear-gradient(90deg, transparent, rgba(124,58,237,0.55), rgba(34,211,238,0.35), transparent)",
                opacity: 0.95,
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
                <div key={step} style={{ paddingTop: 6 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                    <div
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 999,
                        display: "grid",
                        placeItems: "center",
                        fontSize: 11,
                        fontWeight: 700,
                        color: TOKENS.text,
                        background: "linear-gradient(145deg, rgba(124,58,237,0.35), rgba(15,23,42,0.9))",
                        border: `1px solid rgba(167,139,250,0.55)`,
                        boxShadow: "0 0 0 1px rgba(124,58,237,0.15), 0 4px 14px rgba(124,58,237,0.25)",
                        flexShrink: 0,
                      }}
                    >
                      {step}
                    </div>
                    <div style={{ flex: 1, height: 2, background: "rgba(255,255,255,0.1)", minWidth: 12, borderRadius: 1 }} />
                  </div>
                  <div
                    style={{
                      borderRadius: 18,
                      padding: "20px 18px 22px",
                      minHeight: 112,
                      background: "rgba(255,255,255,0.025)",
                      border: `1px solid rgba(255,255,255,0.07)`,
                    }}
                  >
                    <div style={{ color: TOKENS.text, fontSize: 15, fontWeight: 620, lineHeight: 1.25 }}>{title}</div>
                    <p style={{ margin: "12px 0 0 0", color: TOKENS.muted, fontSize: 13, lineHeight: 1.58 }}>{body}</p>
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
          padding: "clamp(88px, 13vw, 160px) 0 clamp(72px, 10vw, 120px)",
          overflow: "visible",
        }}
      >
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: "5% -15% 0",
            background:
              "radial-gradient(ellipse 70% 60% at 58% 42%, rgba(124,58,237,0.32), transparent 58%), radial-gradient(ellipse 45% 40% at 88% 78%, rgba(34,211,238,0.14), transparent 55%)",
            pointerEvents: "none",
          }}
        />
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            background: "radial-gradient(circle at 50% 100%, rgba(0,0,0,0.35), transparent 45%)",
            pointerEvents: "none",
          }}
        />
        <Container style={{ position: "relative", zIndex: 1 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))",
              columnGap: "clamp(16px, 3vw, 32px)",
              rowGap: "clamp(32px, 5vw, 48px)",
              alignItems: "start",
            }}
          >
            <div style={{ maxWidth: 400, paddingTop: 8 }}>
              <div style={{ color: TOKENS.tertiary, fontSize: 11, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase" }}>
                Product surfaces
              </div>
              <h2
                style={{
                  margin: "14px 0 0 0",
                  color: TOKENS.text,
                  fontSize: "clamp(30px, 4vw, 48px)",
                  fontWeight: 620,
                  letterSpacing: "-0.04em",
                  lineHeight: 1.05,
                }}
              >
                One recovery console. One standby experience.
              </h2>
              <p style={{ margin: "16px 0 0 0", color: TOKENS.muted, fontSize: 15, lineHeight: 1.65, maxWidth: 380 }}>
                Operators run the workflow. Customers respond to real openings. PulseFill connects both sides in one
                recovery system.
              </p>
            </div>

            <div
              style={{
                position: "relative",
                minHeight: 500,
                width: "100%",
                maxWidth: 760,
                justifySelf: "stretch",
                filter: "drop-shadow(0 40px 80px rgba(0,0,0,0.45))",
              }}
            >
              <div
                aria-hidden
                style={{
                  position: "absolute",
                  inset: "-12% -6% 0 4%",
                  background: "radial-gradient(circle at 52% 32%, rgba(124,58,237,0.38), transparent 58%)",
                  filter: "blur(28px)",
                  pointerEvents: "none",
                }}
              />
              <div style={{ position: "relative", transform: "scale(1.16)", transformOrigin: "top left" }}>
                <OperatorPayoffMock />
              </div>
              <div
                style={{
                  position: "absolute",
                  right: "clamp(0px, 1vw, 16px)",
                  bottom: "clamp(-12px, -1vw, 8px)",
                  zIndex: 4,
                  transform: "translateX(-20px) scale(1.04)",
                  filter: "drop-shadow(0 26px 44px rgba(0,0,0,0.6))",
                }}
              >
                <CustomerPayoffPhone />
              </div>
              <div
                style={{
                  position: "absolute",
                  top: "10%",
                  right: "2%",
                  zIndex: 5,
                  padding: "8px 11px",
                  borderRadius: 12,
                  border: `1px solid rgba(124,58,237,0.35)`,
                  background: "rgba(5,8,16,0.94)",
                  backdropFilter: "blur(10px)",
                  boxShadow: "0 10px 28px rgba(0,0,0,0.5)",
                }}
              >
                <div style={{ fontSize: 8, color: TOKENS.tertiary, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" }}>
                  Recovered
                </div>
                <div style={{ marginTop: 2, color: TOKENS.text, fontSize: 13, fontWeight: 650 }}>$1.8K</div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* —— Why: statements —— */}
      <section id="why" style={{ padding: "clamp(64px, 9vw, 100px) 0", borderTop: `1px solid rgba(255,255,255,0.06)` }}>
        <Container>
          <div style={{ textAlign: "center", maxWidth: 560, margin: "0 auto 28px" }}>
            <div style={{ color: TOKENS.tertiary, fontSize: 11, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase" }}>
              Why PulseFill
            </div>
            <h2
              style={{
                margin: "10px 0 0 0",
                color: TOKENS.text,
                fontSize: "clamp(24px, 3vw, 34px)",
                fontWeight: 630,
                letterSpacing: "-0.035em",
                lineHeight: 1.12,
              }}
            >
              More than reminders. More than scheduling. A real recovery system.
            </h2>
            <p style={{ margin: "14px auto 0", color: TOKENS.muted, fontSize: 15, lineHeight: 1.65, maxWidth: 520 }}>
              The gap between a cancellation and a recovered booking is still handled too manually in too many businesses.
              PulseFill is the operational layer that closes it.
            </p>
          </div>
          <div style={{ maxWidth: 800, margin: "0 auto", display: "grid", gap: 0 }}>
            {[
              {
                title: "Built for near-term recovery",
                body: "Same-day and short-window openings need speed, ownership, and workflow — not admin overhead.",
              },
              {
                title: "Rules-based and explainable",
                body: "Teams can see why a slot needs action, what should happen next, and where recovery is stalling.",
              },
              {
                title: "One product across both sides",
                body: "Standby demand and operator execution share one system instead of disconnected tools and workarounds.",
              },
            ].map((row, i) => (
              <div
                key={row.title}
                style={{
                  padding: "32px 0 32px 20px",
                  borderTop: i === 0 ? `1px solid rgba(255,255,255,0.08)` : undefined,
                  borderBottom: `1px solid rgba(255,255,255,0.08)`,
                  borderLeft: `3px solid ${i === 0 ? "rgba(124,58,237,0.55)" : "rgba(255,255,255,0.06)"}`,
                }}
              >
                <div style={{ color: TOKENS.text, fontSize: "clamp(18px, 2.2vw, 22px)", fontWeight: 630, letterSpacing: "-0.02em" }}>{row.title}</div>
                <p style={{ margin: "12px 0 0 0", color: TOKENS.muted, fontSize: 15, lineHeight: 1.62, maxWidth: 560 }}>{row.body}</p>
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
              What teams recover with PulseFill
            </h2>
            <p style={{ margin: "10px 0 0 0", color: TOKENS.muted, fontSize: 15, lineHeight: 1.65, maxWidth: 520 }}>
              Recovery becomes measurable when the workflow is visible.
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 240px), 1fr))", gap: 16 }}>
            <div
              style={{
                borderRadius: 22,
                padding: "32px 28px",
                background: "var(--pf-card-hero-bg)",
                border: `1px solid ${TOKENS.violetBorder}`,
                boxShadow: "0 24px 60px rgba(124,58,237,0.18)",
              }}
            >
              <div style={{ color: TOKENS.tertiary, fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase" }}>Recovered bookings</div>
              <div style={{ marginTop: 16, fontSize: 56, fontWeight: 650, letterSpacing: "-0.045em", lineHeight: 0.92 }}>12</div>
              <p style={{ margin: "16px 0 0 0", color: TOKENS.muted, fontSize: 14, lineHeight: 1.58 }}>
                Track recovered appointments where your team already works.
              </p>
            </div>
            <div
              style={{
                borderRadius: 22,
                padding: "32px 28px",
                background: "rgba(255,255,255,0.035)",
                border: `1px solid ${TOKENS.cyanBorder}`,
                boxShadow: "0 24px 60px rgba(34,211,238,0.12)",
              }}
            >
              <div style={{ color: TOKENS.tertiary, fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase" }}>Recovered revenue</div>
              <div style={{ marginTop: 16, fontSize: 56, fontWeight: 650, letterSpacing: "-0.045em", lineHeight: 0.92 }}>$1.8K</div>
              <p style={{ margin: "16px 0 0 0", color: TOKENS.muted, fontSize: 14, lineHeight: 1.58 }}>
                Tie recovery back to revenue the desk already understands.
              </p>
            </div>
          </div>
          <div
            style={{
              marginTop: 14,
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 160px), 1fr))",
              gap: 10,
            }}
          >
            {[
              ["Fill-rate visibility", "Live"],
              ["Workflow clarity", "High"],
              ["Less manual chaos", "Down"],
            ].map(([k, v]) => (
              <div
                key={k}
                style={{
                  padding: "14px 16px",
                  borderRadius: 14,
                  border: `1px solid rgba(255,255,255,0.06)`,
                  background: "rgba(255,255,255,0.015)",
                  opacity: 0.82,
                }}
              >
                <div style={{ fontSize: 9, color: TOKENS.tertiary, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase" }}>{k}</div>
                <div style={{ marginTop: 6, fontSize: 16, fontWeight: 600 }}>{v}</div>
              </div>
            ))}
          </div>
          <p style={{ marginTop: 22, color: TOKENS.muted, fontSize: 14, lineHeight: 1.6, maxWidth: 640 }}>
            PulseFill doesn&apos;t only help teams recover bookings — it helps them understand recovery as a system.
          </p>
        </Container>
      </section>

      {/* —— Trust: spacious editorial —— */}
      <section id="trust" style={{ padding: "clamp(80px, 11vw, 130px) 0 clamp(64px, 8vw, 96px)" }}>
        <Container>
          <div style={{ maxWidth: 520 }}>
            <div style={{ color: TOKENS.tertiary, fontSize: 11, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase" }}>
              Trust
            </div>
            <h2
              style={{
                margin: "8px 0 0 0",
                color: TOKENS.text,
                fontSize: "clamp(26px, 3.2vw, 36px)",
                fontWeight: 620,
                letterSpacing: "-0.035em",
                lineHeight: 1.12,
              }}
            >
              Understandable. Controllable. Real.
            </h2>
            <p style={{ margin: "12px 0 0 0", color: TOKENS.muted, fontSize: 15, lineHeight: 1.72, maxWidth: 500 }}>
              PulseFill makes recovery legible: what needs attention, what can wait, what failed to deliver, what needs
              confirmation, and where coverage is thin.
            </p>
          </div>
          <ul
            style={{
              margin: "24px 0 0 0",
              padding: 0,
              listStyle: "none",
              maxWidth: 420,
              display: "grid",
              gap: 14,
            }}
          >
            {["Clear queue reasons", "Explicit operator actions", "Delivery visibility", "Workflow breakdowns", "No black-box guessing"].map(
              (item) => (
                <li
                  key={item}
                  style={{
                    fontSize: 14,
                    color: TOKENS.text,
                    paddingBottom: 12,
                    borderBottom: `1px solid rgba(255,255,255,0.1)`,
                    letterSpacing: "-0.01em",
                  }}
                >
                  {item}
                </li>
              ),
            )}
          </ul>
          <p style={{ marginTop: 20, color: TOKENS.muted, fontSize: 13, lineHeight: 1.6, maxWidth: 480 }}>
            Teams should never have to guess why a slot was lost or what they should do next.
          </p>
        </Container>
      </section>

      {/* —— Final CTA: poster close —— */}
      <section style={{ padding: "clamp(96px, 15vw, 180px) 0 clamp(104px, 16vw, 200px)" }}>
        <Container>
          <div
            style={{
              position: "relative",
              textAlign: "center",
              padding: "clamp(64px, 10vw, 120px) clamp(24px, 5vw, 48px)",
              borderRadius: 32,
              overflow: "hidden",
            }}
          >
            <div
              aria-hidden
              style={{
                position: "absolute",
                inset: 0,
                background: `
                  radial-gradient(ellipse 65% 55% at 50% 12%, rgba(124,58,237,0.55), transparent 50%),
                  radial-gradient(ellipse 50% 40% at 88% 92%, rgba(34,211,238,0.12), transparent 52%),
                  radial-gradient(circle at 50% 50%, rgba(6,10,20,0.15), rgba(1,3,10,0.94))
                `,
              }}
            />
            <div
              aria-hidden
              style={{
                position: "absolute",
                inset: 0,
                boxShadow: "inset 0 0 140px rgba(0,0,0,0.55)",
                pointerEvents: "none",
              }}
            />
            <div style={{ position: "relative", zIndex: 1, maxWidth: 580, margin: "0 auto" }}>
              <div
                style={{
                  color: TOKENS.tertiary,
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                }}
              >
                Ready to replace the scramble?
              </div>
              <h2
                style={{
                  margin: "14px 0 0 0",
                  color: TOKENS.text,
                  fontSize: "clamp(24px, 3.5vw, 38px)",
                  lineHeight: 1.08,
                  letterSpacing: "-0.038em",
                  fontWeight: 620,
                }}
              >
                Run cancellation recovery like infrastructure — not improvisation.
              </h2>
              <p style={{ margin: "16px auto 0", color: TOKENS.muted, fontSize: 14, lineHeight: 1.68, maxWidth: 440 }}>
                PulseFill gives appointment businesses the missing layer between cancellations and recovered bookings.
              </p>
              <div style={{ marginTop: 34, display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "14px 22px", alignItems: "baseline" }}>
                <PrimaryButton href={demoHref}>Book a demo</PrimaryButton>
                <MutedTextLink href={workflowHref}>Operator sign in</MutedTextLink>
              </div>
              <p style={{ marginTop: 18, color: TOKENS.tertiary, fontSize: 12, lineHeight: 1.55, maxWidth: 420, marginLeft: "auto", marginRight: "auto" }}>
                For teams ready to treat recovery like an operating system, not a daily fire drill.
              </p>
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
        <Container
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 20,
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "grid", gap: 6 }}>
            <span style={{ color: TOKENS.text, fontWeight: 600 }}>PulseFill</span>
            <span style={{ fontSize: 12, color: TOKENS.muted, maxWidth: 320, lineHeight: 1.5 }}>
              Appointment recovery infrastructure for teams running near-term schedule change.
            </span>
          </div>
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
