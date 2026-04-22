"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { Fragment, type CSSProperties, type ReactNode } from "react";
import { CtaChamberMotion } from "@/components/landing/cta-chamber-motion";
import { HeroEntranceMotion } from "@/components/landing/hero-entrance-motion";

const HeroAtmosphere = dynamic(
  () => import("@/components/landing/hero-atmosphere").then((m) => ({ default: m.HeroAtmosphere })),
  { ssr: false },
);
import { HowItWorksPipeline } from "@/components/landing/how-it-works-pipeline";
import { LANDING_PIPELINE_STEPS } from "@/components/landing/landing-data";

const TOKENS = {
  text: "var(--pf-text-primary)",
  muted: "var(--pf-text-secondary)",
  tertiary: "var(--pf-text-tertiary)",
  border: "var(--pf-border-default)",
  borderSubtle: "var(--pf-border-subtle)",
  surface: "var(--pf-card-bg)",
  quiet: "var(--pf-card-quiet-bg)",
  hero: "var(--pf-card-hero-bg)",
  ember: "var(--pf-accent-primary)",
  emberBorder: "var(--pf-accent-primary-border)",
  /** Oxblood / tension (borders, consequence — use sparingly) */
  tension: "var(--pf-accent-secondary)",
  tensionBorder: "var(--pf-accent-secondary-border)",
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
        fontSize: 13,
        fontWeight: 500,
        letterSpacing: "0.04em",
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
function MutedTextLink({ children, href, variant = "default" }: { children: ReactNode; href: string; variant?: "default" | "cta" }) {
  const cta = variant === "cta";
  return (
    <Link
      href={href}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: cta ? 6 : 5,
        fontSize: cta ? 12 : 13,
        fontWeight: cta ? 620 : 500,
        letterSpacing: cta ? "0.04em" : undefined,
        color: cta ? "rgba(186,194,210,0.92)" : "var(--pf-text-tertiary)",
        textDecoration: "none",
        padding: cta ? "8px 0" : "10px 0",
        borderBottom: cta ? "1px solid rgba(255,255,255,0.08)" : undefined,
      }}
    >
      {children}
      <span style={{ opacity: cta ? 0.45 : 0.55 }} aria-hidden>
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
    <div style={{ marginBottom: 4 }}>
      <span
        style={{
          display: "inline-block",
          color: "rgba(245,247,250,0.65)",
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          paddingBottom: 4,
          borderBottom: `1px solid rgba(255,122,24,0.28)`,
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
        border: `1px solid ${accent ? TOKENS.emberBorder : TOKENS.borderSubtle}`,
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
        boxShadow: "0 40px 100px rgba(0,0,0,0.62), 0 0 0 1px rgba(255,122,24,0.14), 0 0 140px rgba(255,122,24,0.22)",
      }}
    >
      <MockBrowserChrome title="PulseFill — Recovery">
        <div
          style={{
            background: "var(--pf-card-hero-bg)",
            border: `1px solid ${TOKENS.emberBorder}`,
            borderRadius: 16,
            padding: 16,
            marginBottom: 12,
            boxShadow: "0 0 0 1px rgba(255,122,24,0.12), 0 18px 48px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.06)",
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
        <div style={{ display: "grid", gap: 10, gridTemplateColumns: "1fr 1fr", opacity: 0.97 }}>
          <div
            style={{
              borderRadius: 14,
              border: `1px solid rgba(255,122,24,0.28)`,
              background: "rgba(255,255,255,0.04)",
              padding: 12,
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
            }}
          >
            <div style={{ color: TOKENS.text, fontSize: 13, fontWeight: 650 }}>What to work first</div>
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
                    background: "rgba(0,0,0,0.28)",
                    fontSize: 12,
                    color: TOKENS.text,
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <span>{label}</span>
                  <span style={{ color: "rgba(253,186,116,0.95)", fontWeight: 700 }}>{count}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ borderRadius: 14, border: `1px solid rgba(255,255,255,0.05)`, background: "rgba(255,255,255,0.02)", padding: 12, opacity: 0.82 }}>
            <div style={{ color: TOKENS.muted, fontSize: 12, fontWeight: 620 }}>Needs attention</div>
            <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
              {["Botox · awaiting confirm", "Hygiene · delivery failed"].map((t) => (
                <div
                  key={t}
                  style={{
                    padding: "8px 10px",
                    borderRadius: 12,
                    background: "rgba(255,255,255,0.02)",
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
        boxShadow: "0 22px 56px rgba(0,0,0,0.55), 0 0 48px rgba(255,122,24,0.12)",
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
            border: `1px solid rgba(255,122,24,0.35)`,
          }}
        >
          <div style={{ color: TOKENS.text, fontSize: 13, fontWeight: 620 }}>Offer available</div>
          <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
            <div
              style={{
                borderRadius: 12,
                padding: "10px 12px",
                background: TOKENS.ember,
                color: "var(--pf-btn-primary-text)",
                fontSize: 12,
                fontWeight: 700,
                textAlign: "center",
              }}
            >
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
        border: `1px solid rgba(255,122,24,0.35)`,
        background: "rgba(4,7,14,0.96)",
        overflow: "hidden",
        boxShadow: "0 40px 100px rgba(0,0,0,0.6), 0 0 140px rgba(255,122,24,0.2)",
      }}
    >
      <MockBrowserChrome title="PulseFill — Operator">
        <div
          style={{
            background: "var(--pf-card-hero-bg)",
            border: `1px solid ${TOKENS.emberBorder}`,
            borderRadius: 18,
            padding: 16,
            marginBottom: 14,
            boxShadow: "0 0 0 1px rgba(255,122,24,0.1), 0 20px 52px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)",
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
          <div style={{ borderRadius: 16, border: `1px solid rgba(255,122,24,0.25)`, background: "rgba(255,255,255,0.04)", padding: 14 }}>
            <div style={{ color: TOKENS.text, fontSize: 14, fontWeight: 650 }}>What to work first</div>
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
                    background: "rgba(0,0,0,0.22)",
                    border: `1px solid rgba(255,255,255,0.06)`,
                    fontSize: 13,
                    color: TOKENS.text,
                  }}
                >
                  <span>{label}</span>
                  <span style={{ color: "rgba(253,186,116,0.95)", fontWeight: 700 }}>{count}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ borderRadius: 16, border: `1px solid rgba(255,255,255,0.06)`, background: "rgba(255,255,255,0.02)", padding: 14, opacity: 0.84 }}>
            <div style={{ color: TOKENS.muted, fontSize: 13, fontWeight: 620 }}>Needs attention now</div>
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
        boxShadow: "0 32px 88px rgba(0,0,0,0.58), 0 0 72px rgba(255,122,24,0.14)",
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
              border: `1px solid rgba(255,122,24,0.32)`,
            }}
          >
            <div style={{ color: TOKENS.text, fontSize: 14, fontWeight: 620 }}>Offer available</div>
            <div style={{ marginTop: 6, color: TOKENS.muted, fontSize: 12 }}>Today · 2:30 PM</div>
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <div
                style={{
                  flex: 1,
                  borderRadius: 12,
                  padding: "10px",
                  background: TOKENS.ember,
                  color: "var(--pf-btn-primary-text)",
                  fontSize: 12,
                  fontWeight: 700,
                  textAlign: "center",
                }}
              >
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

export function PulseFillLandingPage() {
  const demoHref = "mailto:hello@pulsefill.com?subject=PulseFill%20demo";
  const workflowHref = "/sign-in";

  const mainBg: CSSProperties = {
    minHeight: "100vh",
    overflowX: "hidden",
    color: TOKENS.text,
    background: `
      radial-gradient(ellipse 52% 36% at 78% 12%, rgba(255,122,24,0.12), transparent 50%),
      radial-gradient(ellipse 70% 45% at 8% 18%, rgba(201,59,47,0.08), transparent 48%),
      radial-gradient(ellipse 120% 78% at 50% 0%, rgba(0,0,0,0.42), transparent 56%),
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
          background: "rgba(5,5,5,0.82)",
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
              radial-gradient(ellipse 58% 90% at 14% 44%, rgba(0,0,0,0.78), transparent 55%),
              radial-gradient(ellipse 42% 48% at 76% 48%, rgba(255,122,24,0.05), transparent 58%)
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
        <HeroAtmosphere />
        <Container style={{ position: "relative", zIndex: 1 }}>
          <HeroEntranceMotion>
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
              <div style={{ flex: "1 1 280px", maxWidth: 400, minWidth: 0, paddingBottom: "clamp(0px, 2vw, 16px)" }}>
                <div data-hero-reveal>
                  <HeroEyebrow>Appointment Recovery Operating System</HeroEyebrow>
                </div>
                <h1
                  style={{
                    margin: "6px 0 0 0",
                    color: TOKENS.text,
                    fontSize: "clamp(40px, 5.8vw, 76px)",
                    lineHeight: 0.9,
                    letterSpacing: "-0.056em",
                    fontWeight: 680,
                    maxWidth: 420,
                  }}
                >
                  <span data-hero-reveal style={{ display: "block" }}>
                    Cancellations are inevitable.
                  </span>
                  <span data-hero-reveal style={{ display: "block" }}>
                    Lost revenue is not.
                  </span>
                </h1>
                <p
                  data-hero-reveal
                  style={{
                    margin: "26px 0 0 0",
                    color: "rgba(231,236,245,0.88)",
                    fontSize: 15,
                    lineHeight: 1.52,
                    maxWidth: 400,
                    fontWeight: 520,
                  }}
                >
                  The operating layer between cancellations and recovered revenue.
                </p>
                <div
                  data-hero-reveal
                  style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "10px 18px", marginTop: 16 }}
                >
                  <PrimaryButton href={demoHref}>Book a demo</PrimaryButton>
                  <TextLink href="#how-it-works">See the workflow</TextLink>
                </div>
                <p
                  data-hero-reveal
                  style={{ marginTop: 8, color: TOKENS.tertiary, fontSize: 11, lineHeight: 1.5, maxWidth: 300, letterSpacing: "0.02em" }}
                >
                  For teams where recovery windows close fast.
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
                  transform: "translateX(clamp(12px, 3vw, 56px))",
                }}
              >
              <div
                aria-hidden
                style={{
                  position: "absolute",
                  width: "min(68%, 500px)",
                  height: "min(84%, 460px)",
                  left: "66%",
                  top: "50%",
                  transform: "translate(-50%, -50%)",
                  background: "radial-gradient(circle, rgba(255,122,24,0.44) 0%, rgba(255,122,24,0.1) 40%, transparent 66%)",
                  filter: "blur(42px)",
                  opacity: 0.82,
                  pointerEvents: "none",
                }}
              />
              <div
                aria-hidden
                style={{
                  position: "absolute",
                  right: "-2%",
                  bottom: "-4%",
                  width: 200,
                  height: 200,
                  borderRadius: "50%",
                  background: "radial-gradient(circle, rgba(201,59,47,0.2), transparent 70%)",
                  filter: "blur(36px)",
                  pointerEvents: "none",
                }}
              />

              <div
                data-hero-stage
                style={{
                  position: "relative",
                  width: "100%",
                  maxWidth: 740,
                  marginRight: "clamp(-20px, -3vw, 0px)",
                  transformStyle: "preserve-3d",
                }}
              >
                <div
                  style={{
                    transform: "rotate(-0.28deg) scale(1.34)",
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
                    border: "1px solid rgba(255,122,24,0.4)",
                    background: "rgba(4,6,12,0.92)",
                    backdropFilter: "blur(14px)",
                    boxShadow: "0 14px 40px rgba(0,0,0,0.55), 0 0 32px rgba(255,122,24,0.2)",
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
                    transform: "rotate(1.25deg) translateY(20px) translateX(8px) scale(0.84)",
                  }}
                >
                  <CustomerHeroPhone />
                </div>
              </div>
            </div>
          </div>
          </HeroEntranceMotion>
        </Container>
      </section>

      {/* —— Problem: diagnosis rail (mode: system) —— */}
      <section
        id="broken-workflow"
        style={{
          padding: "clamp(44px, 7vw, 72px) 0 clamp(52px, 8vw, 88px)",
          background:
            "radial-gradient(ellipse 70% 55% at 100% 0%, rgba(127,29,29,0.1), transparent 52%), linear-gradient(180deg, rgba(0,0,0,0.16), rgba(0,0,0,0.02))",
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
            <div style={{ flex: "1 1 300px", maxWidth: 520, minWidth: 0, paddingTop: 6 }}>
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
              <p style={{ margin: "16px 0 0 0", color: TOKENS.muted, fontSize: 15, lineHeight: 1.62, maxWidth: 380 }}>
                When a near-term appointment falls out of the schedule, recovery usually depends on calls, texts, memory,
                ad hoc lists, and whoever notices first. Openings expire fast. Staff time gets burned. And most teams still
                can&apos;t see why a slot was lost.
              </p>
            </div>
            <div style={{ flex: "0 1 380px", minWidth: 0, width: "100%", maxWidth: 440 }}>
              {[
                {
                  t: "Openings expire fast",
                  d: "Short windows. Every minute of delay costs the fill.",
                },
                {
                  t: "Manual follow-up doesn't scale",
                  d: "The desk becomes the workflow — not a system.",
                },
                {
                  t: "Most tools stop at the calendar",
                  d: "They store slots. They don't run recovery when the schedule breaks.",
                },
              ].map((row, i) => (
                <div
                  key={row.t}
                  style={{
                    padding: "12px 0 12px 16px",
                    borderLeft: `3px solid ${i === 0 ? "rgba(255,122,24,0.98)" : "rgba(255,255,255,0.06)"}`,
                    borderBottom: `1px solid rgba(255,255,255,0.06)`,
                    opacity: i === 0 ? 1 : 0.78,
                    boxShadow: i === 0 ? "inset 6px 0 18px rgba(255,122,24,0.06)" : undefined,
                  }}
                >
                  <div
                    style={{
                      color: TOKENS.text,
                      fontSize: i === 0 ? 17 : 14,
                      fontWeight: i === 0 ? 650 : 580,
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {row.t}
                  </div>
                  <p style={{ margin: "5px 0 0 0", color: TOKENS.muted, fontSize: 12, lineHeight: 1.5, maxWidth: 300 }}>{row.d}</p>
                </div>
              ))}
              <div
                style={{
                  marginTop: 22,
                  paddingTop: 20,
                  borderTop: "1px solid rgba(255,122,24,0.18)",
                }}
              >
                <div
                  style={{
                    padding: "20px 20px 22px",
                    borderRadius: 0,
                    background: "linear-gradient(165deg, rgba(201,59,47,0.1), rgba(0,0,0,0.97))",
                    borderLeft: "4px solid rgba(255,122,24,0.98)",
                    borderTop: "1px solid rgba(255,255,255,0.05)",
                    borderRight: "1px solid rgba(255,255,255,0.04)",
                    boxShadow: "0 32px 72px rgba(0,0,0,0.62), inset 0 1px 0 rgba(255,255,255,0.02)",
                  }}
                >
                  <div style={{ color: TOKENS.text, fontSize: 9, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase" }}>
                    What teams actually lack
                  </div>
                  <div style={{ marginTop: 10, color: TOKENS.text, fontSize: 24, fontWeight: 660, letterSpacing: "-0.042em", lineHeight: 1.08 }}>
                    Visibility into why recovery stalls
                  </div>
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
          background: "radial-gradient(ellipse 62% 36% at 50% 0%, rgba(255,122,24,0.03), transparent 56%), rgba(0,0,0,0.1)",
        }}
      >
        <Container>
          <div style={{ maxWidth: 560, marginBottom: "clamp(36px, 5vw, 56px)" }}>
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
              padding: "clamp(20px, 4vw, 36px) 0 clamp(28px, 5vw, 48px)",
              borderTop: "1px solid rgba(255,255,255,0.07)",
            }}
          >
            <div
              aria-hidden
              style={{
                position: "absolute",
                left: "2%",
                right: "2%",
                top: 0,
                height: 2,
                borderRadius: 1,
                background: "linear-gradient(90deg, rgba(255,255,255,0.04), rgba(255,122,24,0.42), rgba(253,186,116,0.35), rgba(255,122,24,0.42), rgba(255,255,255,0.04))",
                opacity: 0.75,
                boxShadow: "0 0 22px rgba(255,122,24,0.12)",
              }}
            />
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "flex-end",
                justifyContent: "space-between",
                gap: "4px 8px",
                marginTop: 24,
              }}
            >
              {[
                { k: "Cancellation", t: "A near-term opening appears.", emphasis: "low" as const },
                { k: "Recovery Logic", t: "PulseFill matches demand and guides action.", emphasis: "hero" as const },
                { k: "Recovered Outcome", t: "Bookings and revenue return to the schedule.", emphasis: "medium" as const },
              ].map((block, i) => (
                <Fragment key={block.k}>
                  {i > 0 ? (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-end",
                        alignSelf: "stretch",
                        paddingBottom: 14,
                        color: "rgba(255,122,24,0.38)",
                        fontSize: 11,
                        fontWeight: 600,
                        letterSpacing: "0.24em",
                        flexShrink: 0,
                      }}
                    >
                      —
                    </div>
                  ) : null}
                  <div
                    style={{
                      flex:
                        block.emphasis === "hero"
                          ? "1.5 1 240px"
                          : block.emphasis === "medium"
                            ? "0.95 1 200px"
                            : "0.7 1 160px",
                      minWidth: "min(100%, 160px)",
                      maxWidth: block.emphasis === "hero" ? 400 : block.emphasis === "medium" ? 280 : 240,
                      padding: block.emphasis === "hero" ? "16px 16px 24px 16px" : "2px 2px 14px 0",
                      borderRadius: block.emphasis === "hero" ? 6 : 0,
                      borderBottom:
                        block.emphasis === "hero"
                          ? "5px solid rgba(255,122,24,0.9)"
                          : block.emphasis === "medium"
                            ? "2px solid rgba(255,255,255,0.1)"
                            : "1px solid rgba(255,255,255,0.05)",
                      background: block.emphasis === "hero" ? "rgba(255,122,24,0.07)" : "transparent",
                      opacity: block.emphasis === "hero" ? 1 : block.emphasis === "medium" ? 0.82 : 0.52,
                      boxShadow: block.emphasis === "hero" ? "0 0 48px rgba(255,122,24,0.1), inset 0 -1px 0 rgba(255,122,24,0.12)" : undefined,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 9,
                        fontWeight: 700,
                        letterSpacing: "0.18em",
                        textTransform: "uppercase",
                        color:
                          block.emphasis === "hero"
                            ? "rgba(253,186,116,0.95)"
                            : block.emphasis === "medium"
                              ? "rgba(148,163,184,0.78)"
                              : "rgba(148,163,184,0.52)",
                      }}
                    >
                      {block.k}
                    </div>
                    <p
                      style={{
                        margin: "10px 0 0 0",
                        color: TOKENS.text,
                        fontSize: block.emphasis === "hero" ? 19 : block.emphasis === "medium" ? 15 : 13,
                        lineHeight: 1.42,
                        fontWeight: block.emphasis === "hero" ? 660 : block.emphasis === "medium" ? 600 : 560,
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
          <p style={{ marginTop: 24, color: TOKENS.muted, fontSize: 14, lineHeight: 1.62, maxWidth: 480, letterSpacing: "0.01em" }}>
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

          <HowItWorksPipeline steps={LANDING_PIPELINE_STEPS} />
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
              "radial-gradient(ellipse 66% 54% at 54% 36%, rgba(255,122,24,0.17), transparent 58%), radial-gradient(ellipse 36% 30% at 92% 88%, rgba(201,59,47,0.1), transparent 52%)",
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
                  margin: "10px 0 0 0",
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
              <p style={{ margin: "12px 0 0 0", color: TOKENS.muted, fontSize: 14, lineHeight: 1.52, maxWidth: 300, fontWeight: 520 }}>
                One surface: operators execute, customers claim, revenue returns.
              </p>
              <div style={{ marginTop: 20, display: "grid", gap: 16, maxWidth: 320 }}>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(253,186,116,0.95)" }}>
                    Operator Console
                  </div>
                  <p style={{ margin: "5px 0 0 0", color: TOKENS.muted, fontSize: 12, lineHeight: 1.48 }}>
                    Queue, delivery, close the loop.
                  </p>
                </div>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: TOKENS.tertiary }}>
                    Standby experience
                  </div>
                  <p style={{ margin: "5px 0 0 0", color: TOKENS.muted, fontSize: 12, lineHeight: 1.48 }}>
                    Real openings, fast claims, quiet status.
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
                  background: "radial-gradient(circle at 50% 30%, rgba(255,122,24,0.32), transparent 60%)",
                  filter: "blur(34px)",
                  pointerEvents: "none",
                }}
              />
              <div style={{ position: "relative", transform: "scale(1.38)", transformOrigin: "top left" }}>
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
                  border: "1px solid rgba(255,122,24,0.38)",
                  background: "rgba(3,5,12,0.94)",
                  backdropFilter: "blur(12px)",
                  boxShadow: "0 16px 40px rgba(0,0,0,0.55), 0 0 24px rgba(255,122,24,0.12)",
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

      {/* —— Why: manifesto strip (mode: poster) —— */}
      <section
        id="why"
        style={{
          padding: "clamp(80px, 12vw, 132px) 0",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          background: "linear-gradient(180deg, rgba(0,0,0,0.12), rgba(0,0,0,0.02))",
        }}
      >
        <Container>
          <div style={{ maxWidth: 520, marginBottom: 40 }}>
            <div style={{ color: TOKENS.tertiary, fontSize: 10, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase" }}>
              Why PulseFill
            </div>
            <h2
              style={{
                margin: "14px 0 0 0",
                color: TOKENS.text,
                fontSize: "clamp(28px, 3.8vw, 42px)",
                fontWeight: 620,
                letterSpacing: "-0.042em",
                lineHeight: 1.05,
                maxWidth: 520,
              }}
            >
              More than reminders. More than scheduling. A real recovery system.
            </h2>
            <p style={{ margin: "16px 0 0 0", color: TOKENS.muted, fontSize: 14, lineHeight: 1.58, maxWidth: 400 }}>
              The gap from cancellation to recovered booking is still improvisation for too many teams. PulseFill is the
              layer that makes it operational.
            </p>
          </div>
          <div style={{ maxWidth: 600, display: "grid", gap: 0 }}>
            {[
              {
                n: "01",
                title: "Built for near-term recovery",
                body: "Same-day and short-window openings need speed and ownership — not admin theater.",
              },
              {
                n: "02",
                title: "Rules-based and explainable",
                body: "See why a slot needs action, what happens next, and where recovery stalls.",
              },
              {
                n: "03",
                title: "One product across both sides",
                body: "Standby demand and operator execution in one system — not parallel hacks.",
              },
            ].map((row, i) => (
              <div
                key={row.title}
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "baseline",
                  gap: "14px 24px",
                  padding: "16px 0",
                  borderTop: i === 0 ? `1px solid rgba(255,255,255,0.1)` : undefined,
                  borderBottom: `1px solid rgba(255,255,255,0.08)`,
                }}
              >
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.22em",
                    color: "rgba(255,122,24,0.88)",
                    minWidth: 28,
                    fontVariantNumeric: "tabular-nums",
                    textShadow: "0 0 22px rgba(255,122,24,0.12)",
                  }}
                >
                  {row.n}
                </span>
                <div style={{ flex: "1 1 220px", minWidth: 0 }}>
                  <div style={{ color: TOKENS.text, fontSize: "clamp(17px, 2.1vw, 20px)", fontWeight: 660, letterSpacing: "-0.032em" }}>{row.title}</div>
                  <p style={{ margin: "6px 0 0 0", color: "rgba(148,163,184,0.88)", fontSize: 13, lineHeight: 1.52, maxWidth: 480 }}>
                    {row.body}
                  </p>
                </div>
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
            background: "radial-gradient(ellipse 52% 44% at 38% 36%, rgba(255,122,24,0.06), transparent 58%)",
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
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 260px), 1fr))", gap: 16 }}>
            <div
              style={{
                borderRadius: 4,
                padding: "40px 28px 44px",
                background: "rgba(0,0,0,0.58)",
                border: "1px solid rgba(255,255,255,0.05)",
                borderLeft: "4px solid rgba(255,122,24,0.88)",
                boxShadow: "0 28px 64px rgba(0,0,0,0.42)",
              }}
            >
              <div style={{ color: TOKENS.tertiary, fontSize: 9, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase" }}>Recovered Bookings</div>
              <div style={{ marginTop: 12, fontSize: "clamp(62px, 9.2vw, 84px)", fontWeight: 660, letterSpacing: "-0.056em", lineHeight: 0.86, color: TOKENS.text }}>
                12
              </div>
              <p style={{ margin: "20px 0 0 0", color: "rgba(148,163,184,0.92)", fontSize: 12, lineHeight: 1.5, maxWidth: 260 }}>
                Proof where the team already works — not a buried report.
              </p>
            </div>
            <div
              style={{
                borderRadius: 4,
                padding: "40px 28px 44px",
                background: "rgba(0,0,0,0.52)",
                border: "1px solid rgba(255,255,255,0.05)",
                borderLeft: "4px solid rgba(255,255,255,0.14)",
                boxShadow: "0 24px 56px rgba(0,0,0,0.38)",
              }}
            >
              <div style={{ color: TOKENS.tertiary, fontSize: 9, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase" }}>Recovered Revenue</div>
              <div style={{ marginTop: 12, fontSize: "clamp(62px, 9.2vw, 84px)", fontWeight: 660, letterSpacing: "-0.056em", lineHeight: 0.86, color: TOKENS.text }}>
                $1.8K
              </div>
              <p style={{ margin: "20px 0 0 0", color: "rgba(148,163,184,0.92)", fontSize: 12, lineHeight: 1.5, maxWidth: 260 }}>
                Revenue the desk recognizes — tied to recovery, not guesswork.
              </p>
            </div>
          </div>
          <div
            style={{
              marginTop: 36,
              padding: "28px 0 4px",
              borderTop: "1px solid rgba(255,255,255,0.1)",
              maxWidth: 720,
            }}
          >
            <div style={{ fontSize: 9, color: TOKENS.tertiary, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 18 }}>
              Operating signals
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "28px 44px" }}>
              {[
                ["Fill-rate Visibility", "Live"],
                ["Workflow Clarity", "High"],
                ["Manual Chaos", "Down"],
              ].map(([k, v]) => (
                <div key={k}>
                  <div style={{ fontSize: 9, color: TOKENS.muted, fontWeight: 650, letterSpacing: "0.08em", textTransform: "uppercase" }}>{k}</div>
                  <div style={{ marginTop: 6, fontSize: 24, fontWeight: 680, letterSpacing: "-0.035em", color: TOKENS.text }}>{v}</div>
                </div>
              ))}
            </div>
          </div>
          <p style={{ marginTop: 22, color: TOKENS.muted, fontSize: 12, lineHeight: 1.52, maxWidth: 380 }}>
            Recovery you can read — not desk folklore.
          </p>
        </Container>
      </section>

      {/* —— Trust: control doctrine (mode: system) —— */}
      <section
        id="trust"
        style={{
          padding: "clamp(64px, 10vw, 100px) 0 clamp(80px, 12vw, 120px)",
          background: "linear-gradient(180deg, rgba(0,0,0,0.22), rgba(5,5,5,0.94))",
          borderTop: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <Container>
          <div style={{ maxWidth: 520 }}>
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
                maxWidth: 480,
              }}
            >
              Understandable. Controllable. Real.
            </h2>
            <p style={{ margin: "16px 0 0 0", color: TOKENS.muted, fontSize: 13, lineHeight: 1.62, maxWidth: 400 }}>
              Legible recovery: attention, wait states, failures, confirmations, thin coverage — all explicit.
            </p>
          </div>
          <div
            style={{
              marginTop: 32,
              maxWidth: 620,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(0,0,0,0.72)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.02)",
            }}
          >
            {["Clear queue reasons", "Explicit operator actions", "Delivery visibility", "No black-box guessing"].map((item, i, arr) => (
              <div
                key={item}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0,
                  padding: "14px 20px 14px 0",
                  borderBottom: i < arr.length - 1 ? "1px solid rgba(255,255,255,0.08)" : undefined,
                  fontSize: 13,
                  fontWeight: 620,
                  color: TOKENS.text,
                  letterSpacing: "-0.018em",
                  lineHeight: 1.35,
                  borderLeft: "3px solid rgba(255,122,24,0.42)",
                  paddingLeft: 18,
                }}
              >
                <span>{item}</span>
              </div>
            ))}
          </div>
          <p style={{ marginTop: 28, color: TOKENS.muted, fontSize: 12, lineHeight: 1.55, maxWidth: 360, fontWeight: 500 }}>
            No ambiguity. No theater.
          </p>
        </Container>
      </section>

      {/* —— Final CTA: ceremonial close (mode: poster) —— */}
      <section
        style={{
          padding: "clamp(80px, 13vw, 160px) 0 clamp(96px, 14vw, 180px)",
          background: "radial-gradient(ellipse 90% 55% at 50% 0%, rgba(0,0,0,0.45), rgba(0,0,0,0.78))",
          borderTop: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <Container>
          <CtaChamberMotion>
            <div
              style={{
                position: "relative",
                textAlign: "center",
                padding: "clamp(64px, 11vw, 132px) clamp(20px, 5vw, 48px)",
                borderRadius: 0,
                overflow: "visible",
              }}
            >
              <div
                data-cta-glow
                aria-hidden
                style={{
                  position: "absolute",
                  inset: "-6% -8% -18%",
                  background: `
                  radial-gradient(ellipse 38% 48% at 50% 0%, rgba(255,122,24,0.48), transparent 52%),
                  radial-gradient(ellipse 32% 36% at 94% 98%, rgba(201,59,47,0.12), transparent 52%),
                  radial-gradient(circle at 50% 60%, rgba(4,6,12,0.2), rgba(0,0,0,0.9))
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
              <div style={{ position: "relative", zIndex: 1, maxWidth: 440, margin: "0 auto" }}>
                <div
                  data-cta-reveal
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
                  data-cta-reveal
                  style={{
                    margin: "20px 0 0 0",
                    color: TOKENS.text,
                    fontSize: "clamp(26px, 4vw, 44px)",
                    lineHeight: 1.04,
                    letterSpacing: "-0.045em",
                    fontWeight: 630,
                  }}
                >
                  Run cancellation recovery like infrastructure — not improvisation.
                </h2>
                <p
                  data-cta-reveal
                  style={{ margin: "14px auto 0", color: TOKENS.muted, fontSize: 12, lineHeight: 1.52, maxWidth: 340 }}
                >
                  The operational layer between cancellations and recovered bookings.
                </p>
                <div
                  data-cta-reveal
                  style={{ marginTop: 34, display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "14px 28px", alignItems: "center" }}
                >
                  <PrimaryButton href={demoHref}>Book a demo</PrimaryButton>
                  <MutedTextLink href={workflowHref} variant="cta">
                    Operator sign in
                  </MutedTextLink>
                </div>
              </div>
            </div>
          </CtaChamberMotion>
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
            <Link href="/sign-in" style={{ color: "var(--pf-btn-link-text)", textDecoration: "none", fontWeight: 600 }}>
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
