"use client";

import Link from "next/link";
import { Fragment, type CSSProperties, type ReactNode } from "react";
import { CtaChamberMotion } from "@/components/landing/cta-chamber-motion";
import { HeroEntranceMotion } from "@/components/landing/hero-entrance-motion";
import { HowItWorksPipeline } from "@/components/landing/how-it-works-pipeline";
import { LANDING_PIPELINE_STEPS } from "@/components/landing/landing-data";
import { MarketingRecoveryCaseFile } from "./marketing-recovery-case-file";
import { PayoffProductVisual } from "./marketing-payoff-case-files";
import { authMorphLinkProps } from "@/lib/auth-morph-nav";

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
      {...authMorphLinkProps(href)}
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
      {...authMorphLinkProps(href)}
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
      {...authMorphLinkProps(href)}
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
      {...authMorphLinkProps(href)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: cta ? 6 : 5,
        fontSize: cta ? 12 : 13,
        fontWeight: cta ? 620 : 500,
        letterSpacing: cta ? "0.04em" : undefined,
        color: cta ? "rgba(169,162,154,0.92)" : "var(--pf-text-tertiary)",
        textDecoration: "none",
        padding: cta ? "8px 0" : "10px 0",
        borderBottom: cta ? "1px solid rgba(255, 226, 190, 0.1)" : undefined,
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
          color: "rgba(245,242,237,0.65)",
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          paddingBottom: 4,
          borderBottom: `1px solid rgba(255, 226, 190, 0.22)`,
        }}
      >
        {children}
      </span>
    </div>
  );
}

export function PulseFillLandingPageContent() {
  const demoHref = "mailto:hello@pulsefill.com?subject=PulseFill%20demo";
  const workflowHref = "/sign-in";

  return (
    <main className="pf-marketing-landing" style={{ minHeight: "100vh", overflowX: "hidden" }}>
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 30,
          backdropFilter: "blur(16px) saturate(1.2)",
          background: "rgba(26, 22, 18, 0.88)",
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
              radial-gradient(ellipse 58% 90% at 14% 44%, rgba(32, 26, 20, 0.45), transparent 55%),
              radial-gradient(ellipse 42% 48% at 76% 48%, rgba(255,122,24,0.04), transparent 58%)
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
            backgroundImage: "repeating-linear-gradient(90deg, transparent, transparent 1px, rgba(255, 226, 190, 0.04) 1px, rgba(255, 226, 190, 0.04) 2px)",
            pointerEvents: "none",
          }}
        />
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
                  <HeroEyebrow>Appointment recovery operating system</HeroEyebrow>
                </div>
                <h1
                  style={{
                    margin: "6px 0 0 0",
                    color: TOKENS.text,
                    fontSize: "clamp(34px, 4.8vw, 58px)",
                    lineHeight: 1.05,
                    letterSpacing: "-0.04em",
                    fontWeight: 780,
                    maxWidth: 520,
                  }}
                >
                  <span data-hero-reveal style={{ display: "block" }}>
                    Recover cancelled appointments before the day is lost.
                  </span>
                </h1>
                <p
                  data-hero-reveal
                  style={{
                    margin: "22px 0 0 0",
                    color: "rgba(245,242,237,0.88)",
                    fontSize: 15,
                    lineHeight: 1.55,
                    maxWidth: 440,
                    fontWeight: 520,
                  }}
                >
                  PulseFill turns your waiting list into claimed bookings when cancellations happen.
                </p>
                <div
                  data-hero-reveal
                  style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "10px 18px", marginTop: 16 }}
                >
                  <PrimaryButton href={demoHref}>Book a demo</PrimaryButton>
                  <TextLink href="#how-it-works">See how it works</TextLink>
                </div>
                <p
                  data-hero-reveal
                  style={{ marginTop: 8, color: TOKENS.tertiary, fontSize: 11, lineHeight: 1.5, maxWidth: 300, letterSpacing: "0.02em" }}
                >
                  For teams where recovery windows close fast.
                </p>
              </div>

              <div
                data-hero-stage
                style={{
                  position: "relative",
                  flex: "1.05 1 280px",
                  minWidth: 0,
                  maxWidth: 560,
                  marginLeft: "auto",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-end",
                }}
              >
                <MarketingRecoveryCaseFile />
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
            "radial-gradient(ellipse 70% 55% at 100% 0%, rgba(127,29,29,0.06), transparent 52%), linear-gradient(180deg, rgba(30, 26, 22, 0.5), rgba(20, 17, 14, 0.12))",
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
                  d: "The front desk carries the process in their heads — not in one system everyone trusts.",
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
                    borderLeft: `3px solid ${i === 0 ? "rgba(255, 122, 24, 0.55)" : "rgba(255, 226, 190, 0.1)"}`,
                    borderBottom: `1px solid rgba(255, 226, 190, 0.08)`,
                    opacity: i === 0 ? 1 : 0.78,
                    boxShadow: i === 0 ? "inset 4px 0 12px rgba(255, 122, 24, 0.04)" : undefined,
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
                  borderTop: "1px solid rgba(255, 226, 190, 0.12)",
                }}
              >
                <div
                  style={{
                    padding: "20px 20px 22px",
                    borderRadius: 0,
                    background: "linear-gradient(165deg, rgba(201,59,47,0.06), rgba(28, 24, 20, 0.92))",
                    borderLeft: "3px solid rgba(255, 122, 24, 0.55)",
                    borderTop: "1px solid rgba(255, 226, 190, 0.08)",
                    borderRight: "1px solid rgba(255, 226, 190, 0.06)",
                    boxShadow: "0 20px 48px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.03)",
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
          background: "radial-gradient(ellipse 62% 36% at 50% 0%, rgba(255,122,24,0.04), transparent 56%), rgba(24, 20, 17, 0.35)",
        }}
      >
        <Container>
          <div style={{ maxWidth: 560, marginBottom: "clamp(36px, 5vw, 56px)" }}>
            <div style={{ color: TOKENS.tertiary, fontSize: 10, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase" }}>
              What&apos;s missing today
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
              PulseFill turns disruption into a clear path.
            </h2>
            <p style={{ margin: "16px 0 0 0", color: TOKENS.muted, fontSize: 15, lineHeight: 1.65, maxWidth: 480 }}>
              When someone cancels, PulseFill finds a waiting customer, sends a timed offer, shows who claimed, and leaves
              the desk with one confirmation step before the slot is gone.
            </p>
          </div>

          <div
            style={{
              position: "relative",
              padding: "clamp(20px, 4vw, 36px) 0 clamp(28px, 5vw, 48px)",
              borderTop: "1px solid rgba(255, 226, 190, 0.1)",
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
                background: "linear-gradient(90deg, rgba(255, 226, 190, 0.06), rgba(255,122,24,0.2), rgba(253,186,116,0.18), rgba(255,122,24,0.2), rgba(255, 226, 190, 0.06))",
                opacity: 0.55,
                boxShadow: "none",
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
                { k: "Someone cancels", t: "A near-term opening hits the queue with context.", emphasis: "low" as const },
                { k: "PulseFill matches", t: "Offers go to the right people first — ranked, timed, visible.", emphasis: "hero" as const },
                { k: "Staff confirm", t: "One tap ties the booking back to the calendar and the revenue line.", emphasis: "medium" as const },
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
                          ? "3px solid rgba(255, 122, 24, 0.55)"
                          : block.emphasis === "medium"
                            ? "2px solid rgba(52, 211, 153, 0.35)"
                            : "1px solid rgba(255, 226, 190, 0.1)",
                      background: block.emphasis === "hero" ? "rgba(255, 122, 24, 0.06)" : "transparent",
                      opacity: block.emphasis === "hero" ? 1 : block.emphasis === "medium" ? 0.9 : 0.58,
                      boxShadow: block.emphasis === "hero" ? "inset 0 -1px 0 rgba(255, 122, 24, 0.12)" : undefined,
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
                              ? "rgba(167, 243, 208, 0.85)"
                              : "rgba(169,162,154,0.52)",
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
            From a cancelled visit to a confirmed chair — with the steps and owners visible the whole way.
          </p>
        </Container>
      </section>

      {/* —— How it works: pipeline rail (mode: system) —— */}
      <section
        id="how-it-works"
        style={{
          padding: "clamp(48px, 7vw, 76px) 0 clamp(56px, 8vw, 88px)",
          background: "rgba(24, 20, 17, 0.45)",
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
              PulseFill connects waiting customers, desk actions, and recovered revenue in one place.
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
              "radial-gradient(ellipse 66% 54% at 54% 36%, rgba(255,122,24,0.07), transparent 58%), radial-gradient(ellipse 36% 30% at 92% 88%, rgba(201,59,47,0.06), transparent 52%)",
            pointerEvents: "none",
          }}
        />
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            background: "radial-gradient(circle at 50% 100%, rgba(18, 15, 12, 0.35), transparent 48%)",
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
                  maxWidth: 420,
                }}
              >
                Every opening gets a clear next step.
              </h2>
              <p style={{ margin: "12px 0 0 0", color: TOKENS.muted, fontSize: 14, lineHeight: 1.52, maxWidth: 340, fontWeight: 520 }}>
                One cancelled appointment, one path: match the waitlist, capture the claim, confirm at the desk, keep the
                dollar.
              </p>
              <div style={{ marginTop: 20, display: "grid", gap: 16, maxWidth: 340 }}>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(255, 226, 190, 0.55)" }}>
                    Desk &amp; ops
                  </div>
                  <p style={{ margin: "5px 0 0 0", color: TOKENS.muted, fontSize: 12, lineHeight: 1.48 }}>
                    See the case, who was offered, who claimed, what still needs a confirm.
                  </p>
                </div>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: TOKENS.tertiary }}>
                    Patients on standby
                  </div>
                  <p style={{ margin: "5px 0 0 0", color: TOKENS.muted, fontSize: 12, lineHeight: 1.48 }}>
                    Timed offers, clear queue position, one tap when the slot fits what they asked for.
                  </p>
                </div>
              </div>
            </div>

            <div
              style={{
                flex: "1.2 1 300px",
                minWidth: 0,
                width: "100%",
                maxWidth: 820,
                marginLeft: "auto",
              }}
            >
              <PayoffProductVisual />
            </div>
          </div>
        </Container>
      </section>

      {/* —— Why: manifesto strip (mode: poster) —— */}
      <section
        id="why"
        style={{
          padding: "clamp(80px, 12vw, 132px) 0",
          borderTop: "1px solid rgba(255, 226, 190, 0.08)",
          background: "linear-gradient(180deg, rgba(28, 24, 20, 0.35), rgba(18, 15, 12, 0.08))",
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
              Too many teams still lose the thread between a cancellation and a saved booking. PulseFill keeps that path in
              one system the desk can run.
            </p>
          </div>
          <div style={{ maxWidth: 600, display: "grid", gap: 0 }}>
            {[
              {
                n: "01",
                title: "Built for near-term recovery",
                body: "Same-day and short-window openings need speed and a clear owner — not another inbox thread.",
              },
              {
                n: "02",
                title: "Rules-based and explainable",
                body: "See why a slot needs action, what happens next, and what is still waiting on the desk.",
              },
              {
                n: "03",
                title: "One product across both sides",
                body: "Standby demand and front-desk action share one queue — not parallel spreadsheets.",
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
                  borderTop: i === 0 ? `1px solid rgba(255, 226, 190, 0.12)` : undefined,
                  borderBottom: `1px solid rgba(255, 226, 190, 0.08)`,
                }}
              >
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.22em",
                    color: "rgba(255, 226, 190, 0.55)",
                    minWidth: 28,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {row.n}
                </span>
                <div style={{ flex: "1 1 220px", minWidth: 0 }}>
                  <div style={{ color: TOKENS.text, fontSize: "clamp(17px, 2.1vw, 20px)", fontWeight: 660, letterSpacing: "-0.032em" }}>{row.title}</div>
                  <p style={{ margin: "6px 0 0 0", color: "rgba(169,162,154,0.88)", fontSize: 13, lineHeight: 1.52, maxWidth: 480 }}>
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
              You see confirmations, claims, and dollars in one place — not desk folklore.
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 260px), 1fr))", gap: 16 }}>
            <div
              style={{
                borderRadius: 4,
                padding: "40px 28px 44px",
                background: "rgba(36, 30, 24, 0.75)",
                border: "1px solid rgba(255, 226, 190, 0.1)",
                borderLeft: "3px solid rgba(255, 122, 24, 0.55)",
                boxShadow: "0 16px 40px rgba(0, 0, 0, 0.18)",
              }}
            >
              <div style={{ color: TOKENS.tertiary, fontSize: 9, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase" }}>
                Confirmed bookings
              </div>
              <div style={{ marginTop: 12, fontSize: "clamp(62px, 9.2vw, 84px)", fontWeight: 660, letterSpacing: "-0.056em", lineHeight: 0.86, color: TOKENS.text }}>
                12
              </div>
              <p style={{ margin: "20px 0 0 0", color: "rgba(169,162,154,0.92)", fontSize: 12, lineHeight: 1.5, maxWidth: 260 }}>
                Bookings the team can point to — tied to confirmations, not a buried export.
              </p>
            </div>
            <div
              style={{
                borderRadius: 4,
                padding: "40px 28px 44px",
                background: "rgba(34, 28, 22, 0.72)",
                border: "1px solid rgba(255, 226, 190, 0.1)",
                borderLeft: "3px solid rgba(52, 211, 153, 0.45)",
                boxShadow: "0 14px 36px rgba(0, 0, 0, 0.16)",
              }}
            >
              <div style={{ color: TOKENS.tertiary, fontSize: 9, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase" }}>
                Revenue attributed
              </div>
              <div
                style={{
                  marginTop: 12,
                  fontSize: "clamp(62px, 9.2vw, 84px)",
                  fontWeight: 660,
                  letterSpacing: "-0.056em",
                  lineHeight: 0.86,
                  color: "var(--pf-chip-success-text)",
                }}
              >
                $1.8K
              </div>
              <p style={{ margin: "20px 0 0 0", color: "rgba(169,162,154,0.92)", fontSize: 12, lineHeight: 1.5, maxWidth: 260 }}>
                Dollars the desk recognizes after a real save — not spreadsheet guesswork.
              </p>
            </div>
          </div>
          <div
            style={{
              marginTop: 36,
              padding: "28px 0 4px",
              borderTop: "1px solid rgba(255, 226, 190, 0.1)",
              maxWidth: 720,
            }}
          >
            <div style={{ fontSize: 9, color: TOKENS.tertiary, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 18 }}>
              What you can show later
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "28px 44px" }}>
              {[
                { k: "Timed offers", v: "Who was contacted, and when." },
                { k: "Claims", v: "Who said yes to the opening." },
                { k: "Confirms", v: "What still needs the booking locked in." },
              ].map(({ k, v }) => (
                <div key={k} style={{ flex: "1 1 180px", minWidth: 0, maxWidth: 240 }}>
                  <div style={{ fontSize: 9, color: TOKENS.muted, fontWeight: 650, letterSpacing: "0.08em", textTransform: "uppercase" }}>{k}</div>
                  <p style={{ margin: "8px 0 0 0", color: TOKENS.text, fontSize: 13, lineHeight: 1.45, fontWeight: 520 }}>{v}</p>
                </div>
              ))}
            </div>
          </div>
          <p style={{ marginTop: 22, color: TOKENS.muted, fontSize: 12, lineHeight: 1.52, maxWidth: 380 }}>
            The same story in the queue and on the numbers — no side-channel guesswork.
          </p>
        </Container>
      </section>

      {/* —— Trust: control doctrine (mode: system) —— */}
      <section
        id="trust"
        style={{
          padding: "clamp(64px, 10vw, 100px) 0 clamp(80px, 12vw, 120px)",
          background: "linear-gradient(180deg, rgba(26, 22, 18, 0.55), rgba(22, 18, 15, 0.92))",
          borderTop: "1px solid rgba(255, 226, 190, 0.08)",
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
              Your team stays in control.
            </h2>
            <p style={{ margin: "16px 0 0 0", color: TOKENS.muted, fontSize: 13, lineHeight: 1.62, maxWidth: 420 }}>
              PulseFill shows what happened, who claimed, and what to do next — before the appointment time is lost.
            </p>
          </div>
          <div
            style={{
              marginTop: 32,
              maxWidth: 620,
              border: "1px solid rgba(255, 226, 190, 0.12)",
              background: "rgba(30, 26, 22, 0.85)",
              boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.03)",
            }}
          >
            {["Who was offered — and when", "Who claimed the opening", "What still needs a desk confirm", "What revenue to count as saved"].map((item, i, arr) => (
              <div
                key={item}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0,
                  padding: "14px 20px 14px 0",
                  borderBottom: i < arr.length - 1 ? "1px solid rgba(255, 226, 190, 0.1)" : undefined,
                  fontSize: 13,
                  fontWeight: 620,
                  color: TOKENS.text,
                  letterSpacing: "-0.018em",
                  lineHeight: 1.35,
                  borderLeft: "3px solid rgba(255, 226, 190, 0.22)",
                  paddingLeft: 18,
                }}
              >
                <span>{item}</span>
              </div>
            ))}
          </div>
          <p style={{ marginTop: 28, color: TOKENS.muted, fontSize: 12, lineHeight: 1.55, maxWidth: 380, fontWeight: 500 }}>
            You keep clinical judgment; PulseFill keeps the paper trail the front desk can defend.
          </p>
        </Container>
      </section>

      {/* —— Final CTA: ceremonial close (mode: poster) —— */}
      <section
        style={{
          padding: "clamp(80px, 13vw, 160px) 0 clamp(96px, 14vw, 180px)",
          background:
            "radial-gradient(ellipse 90% 55% at 50% 0%, rgba(32, 26, 20, 0.35), rgba(18, 15, 12, 0.85))",
          borderTop: "1px solid rgba(255, 226, 190, 0.08)",
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
                  radial-gradient(ellipse 38% 48% at 50% 0%, rgba(255,122,24,0.18), transparent 52%),
                  radial-gradient(ellipse 32% 36% at 94% 98%, rgba(201,59,47,0.08), transparent 52%),
                  radial-gradient(circle at 50% 60%, rgba(28, 24, 20, 0.4), rgba(18, 15, 12, 0.75))
                `,
                }}
              />
              <div
                aria-hidden
                style={{
                  position: "absolute",
                  inset: 0,
                  boxShadow: "inset 0 0 120px rgba(18, 15, 12, 0.35)",
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
                  Book a demo
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
                  Turn cancelled visits into confirmed chairs.
                </h2>
                <p
                  data-cta-reveal
                  style={{ margin: "14px auto 0", color: TOKENS.muted, fontSize: 12, lineHeight: 1.52, maxWidth: 400 }}
                >
                  See how PulseFill helps your team catch cancellations, offer the spot to waiting customers, and confirm
                  the booking before the day is lost.
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
            <span style={{ fontSize: 12, color: TOKENS.muted, maxWidth: 340, lineHeight: 1.5 }}>
              Help your team turn cancelled appointments into confirmed bookings — with clear steps and recovered revenue.
            </span>
          </div>
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
            <Link href="/sign-in" style={{ color: "var(--pf-btn-link-text)", textDecoration: "none", fontWeight: 600 }} {...authMorphLinkProps("/sign-in")}>
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
