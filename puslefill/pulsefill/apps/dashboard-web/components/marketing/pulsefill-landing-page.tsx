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
        borderRadius: 12,
        background: "var(--pf-btn-primary-bg)",
        color: "var(--pf-btn-primary-text)",
        padding: "11px 18px",
        fontSize: 13,
        fontWeight: 700,
        textDecoration: "none",
        letterSpacing: "0.01em",
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
        borderRadius: 12,
        background: "var(--pf-btn-secondary-bg)",
        border: "1px solid var(--pf-btn-secondary-border)",
        color: TOKENS.text,
        padding: "11px 18px",
        fontSize: 13,
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
        boxShadow: "0 40px 100px rgba(0,0,0,0.62), 0 0 0 1px rgba(124,58,237,0.14), 0 0 140px rgba(124,58,237,0.22)",
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
                  <span style={{ color: "rgba(196,181,253,0.95)", fontWeight: 700 }}>{count}</span>
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

/** Hero: phone — secondary to console, tucked composition */
function CustomerHeroPhone() {
  return (
    <div
      style={{
        width: 198,
        borderRadius: 28,
        border: `1px solid rgba(255,255,255,0.08)`,
        background: "linear-gradient(165deg, rgba(14,18,30,0.98), rgba(6,8,14,0.98))",
        padding: 7,
        boxShadow: "0 22px 56px rgba(0,0,0,0.55), 0 0 48px rgba(124,58,237,0.12)",
      }}
    >
      <div
        style={{
          borderRadius: 26,
          overflow: "hidden",
          border: `1px solid ${TOKENS.borderSubtle}`,
          minHeight: 320,
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
            border: `1px solid rgba(124,58,237,0.35)`,
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
                  <span style={{ color: "rgba(196,181,253,0.95)", fontWeight: 700 }}>{count}</span>
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
        boxShadow: "0 32px 88px rgba(0,0,0,0.58), 0 0 72px rgba(124,58,237,0.14)",
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
              border: `1px solid rgba(124,58,237,0.32)`,
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
    body: "Near-term cancellation creates revenue risk and a short recovery window.",
  },
  {
    step: "2",
    title: "Standby demand is matched",
    body: "Preferences, availability, and recovery logic surface the right customers.",
  },
  {
    step: "3",
    title: "Operators are guided",
    body: "Queue, retry, confirm, or follow up — with clear reasons and context.",
  },
  {
    step: "4",
    title: "Recovery becomes visible",
    body: "Recovered bookings and revenue surface where the team already works.",
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
      radial-gradient(ellipse 88% 52% at 76% 16%, rgba(124,58,237,0.3), transparent 52%),
      radial-gradient(ellipse 65% 40% at 10% 20%, rgba(34,211,238,0.045), transparent 46%),
      radial-gradient(ellipse 120% 78% at 50% 0%, rgba(0,0,0,0.38), transparent 56%),
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

      {/* —— Hero: poster + product world (mode: poster) —— */}
      <section
        style={{
          position: "relative",
          padding: "clamp(72px, 12vw, 132px) 0 clamp(56px, 9vw, 96px)",
          overflow: "visible",
        }}
      >
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            background: `
              radial-gradient(ellipse 50% 85% at 18% 42%, rgba(0,0,0,0.5), transparent 52%),
              radial-gradient(ellipse 62% 78% at 72% 44%, rgba(124,58,237,0.18), transparent 58%)
            `,
            pointerEvents: "none",
          }}
        />
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0.028,
            backgroundImage: "repeating-linear-gradient(90deg, transparent, transparent 1px, rgba(255,255,255,0.06) 1px, rgba(255,255,255,0.06) 2px)",
            pointerEvents: "none",
          }}
        />
        <Container style={{ position: "relative", zIndex: 1 }}>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              columnGap: "clamp(28px, 5vw, 56px)",
              rowGap: "clamp(36px, 5vw, 52px)",
            }}
          >
            <div style={{ flex: "1 1 280px", maxWidth: 420, minWidth: 0, paddingBottom: "clamp(0px, 2vw, 20px)" }}>
              <HeroEyebrow>Appointment Recovery Operating System</HeroEyebrow>
              <h1
                style={{
                  margin: "12px 0 0 0",
                  color: TOKENS.text,
                  fontSize: "clamp(44px, 6.2vw, 80px)",
                  lineHeight: 0.94,
                  letterSpacing: "-0.058em",
                  fontWeight: 680,
                  maxWidth: 420,
                }}
              >
                <span style={{ display: "block" }}>Cancellations are inevitable.</span>
                <span style={{ display: "block" }}>Lost revenue is not.</span>
              </h1>
              <p
                style={{
                  margin: "22px 0 0 0",
                  color: TOKENS.muted,
                  fontSize: 15,
                  lineHeight: 1.58,
                  maxWidth: 360,
                }}
              >
                PulseFill gives appointment businesses a real operating system for standby demand, operator action, and
                measurable recovery.
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "10px 18px", marginTop: 22 }}>
                <PrimaryButton href={demoHref}>Book a demo</PrimaryButton>
                <TextLink href="#how-it-works">See the workflow</TextLink>
              </div>
              <p style={{ marginTop: 18, color: TOKENS.tertiary, fontSize: 11, lineHeight: 1.55, maxWidth: 340, letterSpacing: "0.02em" }}>
                Built for teams where cancellations happen fast and recovery windows close faster.
              </p>
            </div>

            <div
              style={{
                position: "relative",
                flex: "1.15 1 300px",
                minWidth: 0,
                minHeight: 420,
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                transform: "translateX(clamp(0px, 1.5vw, 32px))",
              }}
            >
              <div
                aria-hidden
                style={{
                  position: "absolute",
                  width: "min(125%, 760px)",
                  height: "min(112%, 560px)",
                  left: "54%",
                  top: "48%",
                  transform: "translate(-50%, -50%)",
                  background: "radial-gradient(circle, rgba(124,58,237,0.52) 0%, rgba(124,58,237,0.2) 38%, rgba(124,58,237,0.06) 55%, transparent 72%)",
                  filter: "blur(52px)",
                  opacity: 0.95,
                  pointerEvents: "none",
                }}
              />
              <div
                aria-hidden
                style={{
                  position: "absolute",
                  right: "-4%",
                  bottom: "-2%",
                  width: 180,
                  height: 220,
                  borderRadius: "50%",
                  background: "radial-gradient(circle, rgba(34,211,238,0.055), transparent 70%)",
                  filter: "blur(40px)",
                  pointerEvents: "none",
                }}
              />

              <div style={{ position: "relative", width: "100%", maxWidth: 700, marginRight: "clamp(-12px, -2vw, 0px)" }}>
                <div
                  style={{
                    transform: "rotate(-0.55deg) scale(1.22)",
                    transformOrigin: "center center",
                    filter: "drop-shadow(0 36px 64px rgba(0,0,0,0.62))",
                  }}
                >
                  <OperatorHeroMock />
                </div>

                <div
                  style={{
                    position: "absolute",
                    top: "6%",
                    right: "8%",
                    zIndex: 6,
                    padding: "9px 12px",
                    borderRadius: 12,
                    border: "1px solid rgba(124,58,237,0.4)",
                    background: "rgba(4,6,12,0.92)",
                    backdropFilter: "blur(14px)",
                    boxShadow: "0 14px 40px rgba(0,0,0,0.55), 0 0 32px rgba(124,58,237,0.2)",
                  }}
                >
                  <div style={{ fontSize: 8, color: TOKENS.tertiary, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase" }}>
                    Recovered revenue
                  </div>
                  <div style={{ marginTop: 4, color: TOKENS.text, fontSize: 15, fontWeight: 650, letterSpacing: "-0.03em" }}>$1.8K</div>
                  <div style={{ marginTop: 2, color: TOKENS.muted, fontSize: 9 }}>Today · rolling</div>
                </div>

                <div
                  style={{
                    position: "absolute",
                    right: "clamp(2px, 1vw, 14px)",
                    bottom: "clamp(-8px, -0.5vw, 4px)",
                    zIndex: 5,
                    filter: "drop-shadow(0 26px 42px rgba(0,0,0,0.68))",
                    transform: "rotate(3deg) translateY(22px) translateX(6px) scale(0.82)",
                  }}
                >
                  <CustomerHeroPhone />
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* —— Problem: diagnosis rail (mode: system) —— */}
      <section
        id="broken-workflow"
        style={{
          padding: "clamp(44px, 7vw, 72px) 0 clamp(52px, 8vw, 88px)",
          background: "linear-gradient(180deg, rgba(0,0,0,0.14), rgba(0,0,0,0.02))",
        }}
      >
        <Container>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "clamp(28px, 6vw, 64px)",
              alignItems: "flex-start",
              justifyContent: "space-between",
            }}
          >
            <div style={{ flex: "1 1 300px", maxWidth: 520, minWidth: 0 }}>
              <div style={{ color: TOKENS.tertiary, fontSize: 10, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase" }}>
                The problem
              </div>
              <h2
                style={{
                  margin: "14px 0 0 0",
                  color: TOKENS.text,
                  fontSize: "clamp(28px, 3.6vw, 44px)",
                  fontWeight: 620,
                  letterSpacing: "-0.04em",
                  lineHeight: 1.05,
                  maxWidth: 460,
                }}
              >
                Most teams still handle cancellations with a scramble.
              </h2>
              <p style={{ margin: "16px 0 0 0", color: TOKENS.muted, fontSize: 15, lineHeight: 1.65, maxWidth: 400 }}>
                When a near-term appointment falls out of the schedule, recovery usually depends on calls, texts, memory,
                ad hoc lists, and whoever notices first. Openings expire fast. Staff time gets burned. And most teams still
                can&apos;t see why a slot was lost.
              </p>
            </div>
            <div style={{ flex: "0 1 380px", minWidth: 0, width: "100%", maxWidth: 440 }}>
              {[
                {
                  t: "Openings expire fast",
                  d: "Close-in cancellations create short recovery windows where every minute of delay lowers the odds of filling the slot.",
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
                    padding: "18px 0 18px 16px",
                    borderLeft: `2px solid ${i === 0 ? "rgba(124,58,237,0.75)" : "rgba(255,255,255,0.06)"}`,
                    borderBottom: i < 2 ? `1px solid rgba(255,255,255,0.05)` : "none",
                  }}
                >
                  <div style={{ color: TOKENS.text, fontSize: 16, fontWeight: i === 0 ? 650 : 600, letterSpacing: "-0.02em" }}>{row.t}</div>
                  <p style={{ margin: "8px 0 0 0", color: TOKENS.muted, fontSize: 13, lineHeight: 1.58 }}>{row.d}</p>
                </div>
              ))}
              <div
                style={{
                  marginTop: 20,
                  padding: "16px 18px 18px",
                  borderRadius: 0,
                  background: "rgba(3,4,10,0.75)",
                  borderLeft: "3px solid rgba(124,58,237,0.65)",
                  borderTop: "1px solid rgba(255,255,255,0.06)",
                  borderRight: "1px solid rgba(255,255,255,0.04)",
                  borderBottom: "1px solid rgba(255,255,255,0.04)",
                }}
              >
                <div style={{ color: TOKENS.tertiary, fontSize: 9, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase" }}>
                  What teams actually lack
                </div>
                <div style={{ marginTop: 8, color: TOKENS.text, fontSize: 20, fontWeight: 650, letterSpacing: "-0.03em", lineHeight: 1.15 }}>
                  Visibility into why recovery stalls
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* —— Missing layer: thesis diagram (mode: system) —— */}
      <section
        id="missing-layer"
        style={{
          padding: "clamp(88px, 14vw, 160px) 0 clamp(72px, 11vw, 120px)",
          background: "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(124,58,237,0.08), transparent 55%), rgba(0,0,0,0.08)",
        }}
      >
        <Container>
          <div style={{ maxWidth: 560, marginBottom: "clamp(40px, 6vw, 64px)" }}>
            <div style={{ color: TOKENS.tertiary, fontSize: 10, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase" }}>
              The missing layer
            </div>
            <h2
              style={{
                margin: "14px 0 0 0",
                color: TOKENS.text,
                fontSize: "clamp(30px, 4vw, 48px)",
                fontWeight: 620,
                letterSpacing: "-0.042em",
                lineHeight: 1.04,
                maxWidth: 520,
              }}
            >
              PulseFill turns disruption into a workflow.
            </h2>
            <p style={{ margin: "16px 0 0 0", color: TOKENS.muted, fontSize: 15, lineHeight: 1.65, maxWidth: 480 }}>
              Instead of reacting to cancellations manually, your team gets a system: surface the right standby demand,
              queue the right action, confirm recoveries quickly, and track what was saved.
            </p>
          </div>

          <div
            style={{
              position: "relative",
              padding: "clamp(8px, 2vw, 16px) 0 8px",
              borderTop: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <div
              aria-hidden
              style={{
                position: "absolute",
                left: "6%",
                right: "6%",
                top: 0,
                height: 1,
                background: "linear-gradient(90deg, transparent, rgba(124,58,237,0.45), rgba(124,58,237,0.65), rgba(124,58,237,0.45), transparent)",
                opacity: 0.9,
              }}
            />
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "stretch",
                justifyContent: "space-between",
                gap: "12px 8px",
                marginTop: 28,
              }}
            >
              {[
                { k: "Cancellation", t: "A near-term opening appears.", emphasis: "quiet" as const },
                { k: "Recovery Logic", t: "PulseFill matches demand and guides action.", emphasis: "hero" as const },
                { k: "Recovered Outcome", t: "Bookings and revenue return to the schedule.", emphasis: "quiet" as const },
              ].map((block, i) => (
                <Fragment key={block.k}>
                  {i > 0 ? (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        alignSelf: "center",
                        color: "rgba(148,163,184,0.45)",
                        fontSize: 20,
                        fontWeight: 300,
                        letterSpacing: "0.12em",
                        padding: "0 4px",
                        flexShrink: 0,
                      }}
                    >
                      ——
                    </div>
                  ) : null}
                  <div
                    style={{
                      flex: block.emphasis === "hero" ? "1.25 1 220px" : "1 1 200px",
                      minWidth: "min(100%, 200px)",
                      maxWidth: block.emphasis === "hero" ? 340 : 280,
                      padding: block.emphasis === "hero" ? "8px 8px 20px 0" : "8px 8px 16px 0",
                      borderBottom: block.emphasis === "hero" ? "2px solid rgba(124,58,237,0.65)" : "1px solid rgba(255,255,255,0.07)",
                      background: "transparent",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 9,
                        fontWeight: 700,
                        letterSpacing: "0.18em",
                        textTransform: "uppercase",
                        color: block.emphasis === "hero" ? "rgba(196,181,253,0.95)" : TOKENS.tertiary,
                      }}
                    >
                      {block.k}
                    </div>
                    <p
                      style={{
                        margin: "12px 0 0 0",
                        color: TOKENS.text,
                        fontSize: block.emphasis === "hero" ? 17 : 15,
                        lineHeight: 1.5,
                        fontWeight: block.emphasis === "hero" ? 650 : 600,
                        letterSpacing: "-0.02em",
                      }}
                    >
                      {block.t}
                    </p>
                  </div>
                </Fragment>
              ))}
            </div>
          </div>
          <p style={{ marginTop: 36, color: TOKENS.muted, fontSize: 14, lineHeight: 1.65, maxWidth: 520, letterSpacing: "0.01em" }}>
            From schedule disruption to measurable recovery — in one operational flow.
          </p>
        </Container>
      </section>

      {/* —— How it works: pipeline rail (mode: system) —— */}
      <section
        id="how-it-works"
        style={{
          padding: "clamp(48px, 7vw, 76px) 0 clamp(56px, 8vw, 88px)",
          background: "rgba(0,0,0,0.2)",
        }}
      >
        <Container>
          <div style={{ maxWidth: 560, marginBottom: 22 }}>
            <div style={{ color: TOKENS.tertiary, fontSize: 10, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase" }}>
              How it works
            </div>
            <h2
              style={{
                margin: "12px 0 0 0",
                color: TOKENS.text,
                fontSize: "clamp(24px, 2.8vw, 32px)",
                fontWeight: 620,
                letterSpacing: "-0.038em",
                lineHeight: 1.08,
              }}
            >
              From open slot to recovered booking
            </h2>
            <p style={{ margin: "10px 0 0 0", color: TOKENS.muted, fontSize: 14, lineHeight: 1.6, maxWidth: 480 }}>
              PulseFill connects standby demand, operator action, and recovered outcomes in one workflow.
            </p>
          </div>

          <div style={{ position: "relative" }}>
            <div
              aria-hidden
              style={{
                position: "absolute",
                left: "2%",
                right: "2%",
                top: 11,
                height: 1,
                borderRadius: 1,
                background: "linear-gradient(90deg, transparent, rgba(124,58,237,0.5), rgba(124,58,237,0.75), rgba(124,58,237,0.5), transparent)",
                opacity: 0.85,
                pointerEvents: "none",
              }}
            />
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 200px), 1fr))",
                gap: 12,
                alignItems: "stretch",
              }}
            >
              {STEPS.map(({ step, title, body }) => (
                <div key={step} style={{ paddingTop: 4 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                    <div
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: 999,
                        display: "grid",
                        placeItems: "center",
                        fontSize: 10,
                        fontWeight: 700,
                        color: TOKENS.text,
                        background: "linear-gradient(145deg, rgba(124,58,237,0.4), rgba(10,12,20,0.95))",
                        border: `1px solid rgba(167,139,250,0.45)`,
                        flexShrink: 0,
                      }}
                    >
                      {step}
                    </div>
                    <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)", minWidth: 8, borderRadius: 1 }} />
                  </div>
                  <div
                    style={{
                      borderRadius: 12,
                      padding: "14px 14px 16px",
                      minHeight: 96,
                      background: "rgba(255,255,255,0.018)",
                      border: "1px solid rgba(255,255,255,0.045)",
                    }}
                  >
                    <div style={{ color: TOKENS.text, fontSize: 14, fontWeight: 620, lineHeight: 1.22 }}>{title}</div>
                    <p style={{ margin: "8px 0 0 0", color: TOKENS.muted, fontSize: 12, lineHeight: 1.55 }}>{body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </section>

      {/* —— Product: second hero / proof world (mode: product) —— */}
      <section
        id="product"
        style={{
          position: "relative",
          padding: "clamp(96px, 15vw, 180px) 0 clamp(80px, 12vw, 140px)",
          overflow: "visible",
        }}
      >
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: "2% -18% 0",
            background:
              "radial-gradient(ellipse 78% 68% at 52% 38%, rgba(124,58,237,0.42), transparent 58%), radial-gradient(ellipse 36% 30% at 92% 88%, rgba(34,211,238,0.045), transparent 52%)",
            pointerEvents: "none",
          }}
        />
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            background: "radial-gradient(circle at 50% 100%, rgba(0,0,0,0.42), transparent 48%)",
            pointerEvents: "none",
          }}
        />
        <Container style={{ position: "relative", zIndex: 1 }}>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: "clamp(28px, 5vw, 48px)",
            }}
          >
            <div style={{ flex: "0 1 340px", maxWidth: 380, minWidth: 0, paddingTop: 4 }}>
              <div style={{ color: TOKENS.tertiary, fontSize: 10, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase" }}>
                Product surfaces
              </div>
              <h2
                style={{
                  margin: "12px 0 0 0",
                  color: TOKENS.text,
                  fontSize: "clamp(32px, 4.5vw, 52px)",
                  fontWeight: 620,
                  letterSpacing: "-0.045em",
                  lineHeight: 1.02,
                  maxWidth: 360,
                }}
              >
                One recovery console. One standby experience.
              </h2>
              <p style={{ margin: "14px 0 0 0", color: TOKENS.muted, fontSize: 14, lineHeight: 1.58, maxWidth: 340 }}>
                Operators run the workflow. Customers respond to real openings — one recovery system.
              </p>
              <div style={{ marginTop: 24, display: "grid", gap: 18, maxWidth: 340 }}>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(196,181,253,0.95)" }}>
                    Operator console
                  </div>
                  <p style={{ margin: "6px 0 0 0", color: TOKENS.muted, fontSize: 12, lineHeight: 1.55 }}>
                    Overview, queue, slot detail, recovery status, delivery visibility, recovered revenue.
                  </p>
                </div>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: TOKENS.tertiary }}>
                    Standby experience
                  </div>
                  <p style={{ margin: "6px 0 0 0", color: TOKENS.muted, fontSize: 12, lineHeight: 1.55 }}>
                    Preferences, matched openings, claim flow, active standby, status.
                  </p>
                </div>
              </div>
            </div>

            <div
              style={{
                position: "relative",
                flex: "1.2 1 300px",
                minWidth: 0,
                minHeight: 520,
                width: "100%",
                maxWidth: 820,
                filter: "drop-shadow(0 48px 96px rgba(0,0,0,0.5))",
              }}
            >
              <div
                aria-hidden
                style={{
                  position: "absolute",
                  inset: "-14% -8% 0 0",
                  background: "radial-gradient(circle at 50% 30%, rgba(124,58,237,0.45), transparent 60%)",
                  filter: "blur(36px)",
                  pointerEvents: "none",
                }}
              />
              <div style={{ position: "relative", transform: "scale(1.24)", transformOrigin: "top left" }}>
                <OperatorPayoffMock />
              </div>
              <div
                style={{
                  position: "absolute",
                  right: "clamp(-4px, 0.5vw, 12px)",
                  bottom: "clamp(-20px, -1vw, 0px)",
                  zIndex: 4,
                  transform: "translateX(-28px) scale(0.92)",
                  filter: "drop-shadow(0 32px 52px rgba(0,0,0,0.65))",
                }}
              >
                <CustomerPayoffPhone />
              </div>
              <div
                style={{
                  position: "absolute",
                  top: "8%",
                  right: "0%",
                  zIndex: 5,
                  padding: "10px 12px",
                  borderRadius: 11,
                  border: "1px solid rgba(124,58,237,0.42)",
                  background: "rgba(3,5,12,0.94)",
                  backdropFilter: "blur(12px)",
                  boxShadow: "0 16px 40px rgba(0,0,0,0.55), 0 0 36px rgba(124,58,237,0.18)",
                }}
              >
                <div style={{ fontSize: 8, color: TOKENS.tertiary, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase" }}>
                  Recovered revenue
                </div>
                <div style={{ marginTop: 3, color: TOKENS.text, fontSize: 15, fontWeight: 650, letterSpacing: "-0.03em" }}>$1.8K</div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* —— Why: category separation (mode: poster / calm) —— */}
      <section
        id="why"
        style={{
          padding: "clamp(72px, 11vw, 120px) 0",
          borderTop: "1px solid rgba(255,255,255,0.05)",
          background: "linear-gradient(180deg, rgba(0,0,0,0.06), transparent)",
        }}
      >
        <Container>
          <div style={{ textAlign: "center", maxWidth: 640, margin: "0 auto 40px" }}>
            <div style={{ color: TOKENS.tertiary, fontSize: 10, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase" }}>
              Why PulseFill
            </div>
            <h2
              style={{
                margin: "14px 0 0 0",
                color: TOKENS.text,
                fontSize: "clamp(26px, 3.6vw, 40px)",
                fontWeight: 620,
                letterSpacing: "-0.04em",
                lineHeight: 1.08,
              }}
            >
              More than reminders. More than scheduling. A real recovery system.
            </h2>
            <p style={{ margin: "16px auto 0", color: TOKENS.muted, fontSize: 14, lineHeight: 1.62, maxWidth: 480 }}>
              The gap between a cancellation and a recovered booking is still handled too manually in too many businesses.
              PulseFill is the operational layer that closes it.
            </p>
          </div>
          <div style={{ maxWidth: 720, margin: "0 auto", display: "grid", gap: 0 }}>
            {[
              {
                title: "Built for near-term recovery",
                body: "Same-day and short-window openings need speed, ownership, and workflow — not admin overhead.",
                weight: 1,
              },
              {
                title: "Rules-based and explainable",
                body: "Teams can see why a slot needs action, what should happen next, and where recovery is stalling.",
                weight: 2,
              },
              {
                title: "One product across both sides",
                body: "Standby demand and operator execution share one system instead of disconnected tools and workarounds.",
                weight: 3,
              },
            ].map((row, i) => (
              <div
                key={row.title}
                style={{
                  padding: "28px 0 28px 0",
                  borderTop: i === 0 ? `1px solid rgba(255,255,255,0.07)` : undefined,
                  borderBottom: `1px solid rgba(255,255,255,0.06)`,
                }}
              >
                <div
                  style={{
                    color: TOKENS.text,
                    fontSize: row.weight === 2 ? "clamp(19px, 2.4vw, 24px)" : "clamp(17px, 2.1vw, 20px)",
                    fontWeight: row.weight === 2 ? 650 : 620,
                    letterSpacing: "-0.025em",
                    maxWidth: 560,
                    margin: "0 auto",
                    textAlign: "center",
                  }}
                >
                  {row.title}
                </div>
                <p
                  style={{
                    margin: "10px auto 0",
                    color: TOKENS.muted,
                    fontSize: 14,
                    lineHeight: 1.6,
                    maxWidth: 480,
                    textAlign: "center",
                  }}
                >
                  {row.body}
                </p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* —— Outcomes: evidence (mode: product) —— */}
      <section
        id="value"
        style={{
          padding: "clamp(80px, 12vw, 140px) 0 clamp(72px, 10vw, 120px)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: "20% -20% -10%",
            background: "radial-gradient(ellipse 70% 55% at 40% 40%, rgba(124,58,237,0.12), transparent 60%)",
            pointerEvents: "none",
          }}
        />
        <Container style={{ position: "relative" }}>
          <div style={{ maxWidth: 480, marginBottom: 40 }}>
            <div style={{ color: TOKENS.tertiary, fontSize: 10, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase" }}>
              Outcomes
            </div>
            <h2
              style={{
                margin: "12px 0 0 0",
                color: TOKENS.text,
                fontSize: "clamp(28px, 3.4vw, 38px)",
                fontWeight: 620,
                letterSpacing: "-0.04em",
                lineHeight: 1.06,
              }}
            >
              What teams recover with PulseFill
            </h2>
            <p style={{ margin: "12px 0 0 0", color: TOKENS.muted, fontSize: 14, lineHeight: 1.6, maxWidth: 420 }}>
              Recovery becomes measurable when the workflow is visible.
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 260px), 1fr))", gap: 20 }}>
            <div
              style={{
                borderRadius: 18,
                padding: "36px 32px 40px",
                background: "var(--pf-card-hero-bg)",
                border: `1px solid ${TOKENS.violetBorder}`,
                boxShadow: "0 32px 72px rgba(124,58,237,0.22)",
              }}
            >
              <div style={{ color: TOKENS.tertiary, fontSize: 9, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase" }}>Recovered Bookings</div>
              <div style={{ marginTop: 18, fontSize: "clamp(56px, 8vw, 72px)", fontWeight: 650, letterSpacing: "-0.05em", lineHeight: 0.9 }}>12</div>
              <p style={{ margin: "18px 0 0 0", color: TOKENS.muted, fontSize: 13, lineHeight: 1.55, maxWidth: 280 }}>
                Track recovered appointments where your team already works.
              </p>
            </div>
            <div
              style={{
                borderRadius: 18,
                padding: "36px 32px 40px",
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.1)",
                boxShadow: "0 28px 64px rgba(0,0,0,0.35)",
              }}
            >
              <div style={{ color: TOKENS.tertiary, fontSize: 9, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase" }}>Recovered Revenue</div>
              <div style={{ marginTop: 18, fontSize: "clamp(56px, 8vw, 72px)", fontWeight: 650, letterSpacing: "-0.05em", lineHeight: 0.9 }}>$1.8K</div>
              <p style={{ margin: "18px 0 0 0", color: TOKENS.muted, fontSize: 13, lineHeight: 1.55, maxWidth: 280 }}>
                Tie recovery back to revenue the desk already understands.
              </p>
            </div>
          </div>
          <div
            style={{
              marginTop: 28,
              display: "flex",
              flexWrap: "wrap",
              gap: "28px 40px",
              paddingTop: 28,
              borderTop: "1px solid rgba(255,255,255,0.06)",
              maxWidth: 720,
            }}
          >
            {[
              ["Fill-rate Visibility", "Live"],
              ["Workflow Clarity", "High"],
              ["Less Manual Chaos", "Down"],
            ].map(([k, v]) => (
              <div key={k} style={{ minWidth: "min(100%, 200px)" }}>
                <div style={{ fontSize: 9, color: TOKENS.tertiary, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase" }}>{k}</div>
                <div style={{ marginTop: 6, fontSize: 18, fontWeight: 600, letterSpacing: "-0.02em" }}>{v}</div>
              </div>
            ))}
          </div>
          <p style={{ marginTop: 32, color: TOKENS.muted, fontSize: 13, lineHeight: 1.6, maxWidth: 480 }}>
            PulseFill doesn&apos;t only help teams recover bookings — it helps them understand recovery as a system.
          </p>
        </Container>
      </section>

      {/* —— Trust: field manual (mode: system) —— */}
      <section
        id="trust"
        style={{
          padding: "clamp(56px, 9vw, 88px) 0 clamp(72px, 11vw, 120px)",
          background: "rgba(0,0,0,0.16)",
        }}
      >
        <Container>
          <div style={{ maxWidth: 480 }}>
            <div style={{ color: TOKENS.tertiary, fontSize: 10, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase" }}>
              Trust
            </div>
            <h2
              style={{
                margin: "10px 0 0 0",
                color: TOKENS.text,
                fontSize: "clamp(28px, 3.6vw, 40px)",
                fontWeight: 620,
                letterSpacing: "-0.04em",
                lineHeight: 1.06,
              }}
            >
              Understandable. Controllable. Real.
            </h2>
            <p style={{ margin: "14px 0 0 0", color: TOKENS.muted, fontSize: 14, lineHeight: 1.65, maxWidth: 420 }}>
              PulseFill makes recovery legible: what needs attention, what can wait, what failed to deliver, what needs
              confirmation, and where coverage is thin.
            </p>
          </div>
          <div
            style={{
              marginTop: 32,
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))",
              columnGap: 40,
              rowGap: 20,
              maxWidth: 640,
            }}
          >
            {["Clear queue reasons", "Explicit operator actions", "Delivery visibility", "Workflow breakdowns", "No black-box guessing"].map(
              (item) => (
                <div
                  key={item}
                  style={{
                    fontSize: 13,
                    color: TOKENS.text,
                    letterSpacing: "-0.01em",
                    paddingLeft: 14,
                    borderLeft: "1px solid rgba(255,255,255,0.1)",
                    lineHeight: 1.45,
                  }}
                >
                  {item}
                </div>
              ),
            )}
          </div>
          <p style={{ marginTop: 28, color: TOKENS.muted, fontSize: 12, lineHeight: 1.6, maxWidth: 400 }}>
            Teams should never have to guess why a slot was lost or what they should do next.
          </p>
        </Container>
      </section>

      {/* —— Final CTA: ceremonial close (mode: poster) —— */}
      <section
        style={{
          padding: "clamp(120px, 18vw, 220px) 0 clamp(120px, 18vw, 220px)",
          background: "radial-gradient(ellipse 90% 60% at 50% 0%, rgba(0,0,0,0.35), rgba(0,0,0,0.65))",
        }}
      >
        <Container>
          <div
            style={{
              position: "relative",
              textAlign: "center",
              padding: "clamp(72px, 12vw, 140px) clamp(20px, 5vw, 56px)",
              borderRadius: 0,
              overflow: "visible",
            }}
          >
            <div
              aria-hidden
              style={{
                position: "absolute",
                inset: "-8% -12% -20%",
                background: `
                  radial-gradient(ellipse 55% 70% at 50% 0%, rgba(124,58,237,0.5), transparent 52%),
                  radial-gradient(ellipse 42% 45% at 92% 96%, rgba(34,211,238,0.09), transparent 50%),
                  radial-gradient(circle at 50% 60%, rgba(4,6,12,0.2), rgba(0,0,0,0.88))
                `,
              }}
            />
            <div
              aria-hidden
              style={{
                position: "absolute",
                inset: 0,
                boxShadow: "inset 0 0 160px rgba(0,0,0,0.6)",
                pointerEvents: "none",
              }}
            />
            <div style={{ position: "relative", zIndex: 1, maxWidth: 560, margin: "0 auto" }}>
              <div
                style={{
                  color: TOKENS.tertiary,
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                }}
              >
                Ready to replace the scramble?
              </div>
              <h2
                style={{
                  margin: "18px 0 0 0",
                  color: TOKENS.text,
                  fontSize: "clamp(28px, 4.2vw, 46px)",
                  lineHeight: 1.05,
                  letterSpacing: "-0.042em",
                  fontWeight: 620,
                }}
              >
                Run cancellation recovery like infrastructure — not improvisation.
              </h2>
              <p style={{ margin: "18px auto 0", color: TOKENS.muted, fontSize: 13, lineHeight: 1.65, maxWidth: 440 }}>
                PulseFill gives appointment businesses the missing operational layer between cancellations and recovered
                bookings.
              </p>
              <div style={{ marginTop: 36, display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "12px 24px", alignItems: "center" }}>
                <PrimaryButton href={demoHref}>Book a demo</PrimaryButton>
                <MutedTextLink href={workflowHref}>Operator sign in</MutedTextLink>
              </div>
              <p style={{ marginTop: 22, color: TOKENS.tertiary, fontSize: 11, lineHeight: 1.55, maxWidth: 360, marginLeft: "auto", marginRight: "auto" }}>
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
          <span>© 2026 PulseFill</span>
        </Container>
      </footer>
    </main>
  );
}
