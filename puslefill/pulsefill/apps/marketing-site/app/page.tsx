import Image from "next/image";
import Link from "next/link";
import { MarketingRecoveryBlock } from "../components/marketing-recovery-block";

const outcomes = [
  { label: "Standby reach", value: "2.4k" },
  { label: "Avg. claim time", value: "6m" },
  { label: "Recovered revenue", value: "$18.6k" },
];

const operatorTiles = [
  {
    title: "Command center",
    body: "Recovery queue, next actions, and live signals — the same surface operators see after sign-in.",
  },
  {
    title: "Openings & claims",
    body: "Capture cancellations, send offers, and confirm claims without losing context.",
  },
  {
    title: "Customers & activity",
    body: "Standby demand, outreach history, and audit-friendly timelines in one warm console.",
  },
];

const segments = ["Dental", "Medspa", "Wellness", "Clinics"];

export default function HomePage() {
  return (
    <main>
      <section className="hero">
        <nav className="nav" aria-label="Main navigation">
          <Link className="brand" href="/">
            <span className="brand-mark">P</span>
            <span>PulseFill</span>
          </Link>
          <div className="nav-links">
            <Link href="/pricing">Pricing</Link>
            <Link href="/demo">Demo</Link>
            <Link href="/contact">Contact</Link>
          </div>
        </nav>

        <div className="hero-grid ms-hero-grid">
          <div className="hero-copy">
            <p className="eyebrow">Cancellation recovery infrastructure</p>
            <h1>Recover cancelled appointments before the calendar goes cold.</h1>
            <p className="hero-lede">
              PulseFill turns last-minute openings into fast, qualified claims with standby matching, offer timing, and
              confirmation workflows built for busy front desks.
            </p>
            <div className="hero-actions">
              <Link className="button primary" href="/demo">
                Book a demo
              </Link>
              <Link className="button secondary" href="/pricing">
                View pricing
              </Link>
            </div>
            <div className="segment-row" aria-label="Supported appointment businesses">
              {segments.map((segment) => (
                <span key={segment}>{segment}</span>
              ))}
            </div>
          </div>

          <div className="hero-visual-column">
            <div className="ms-hero-pipeline" aria-label="Recovery pipeline preview">
              <p className="pf-kicker" style={{ margin: "0 0 10px" }}>
                Live recovery path
              </p>
              <MarketingRecoveryBlock activeStep="matched" compact showTitle={false} />
            </div>
            <div className="product-stage" aria-label="PulseFill web and iOS product previews">
              <div className="dashboard-frame">
                <div className="frame-top">
                  <span />
                  <span />
                  <span />
                  <strong>Recovery command center</strong>
                </div>
                <Image
                  src="/pulsefill-web.png"
                  alt="PulseFill web dashboard showing cancellation recovery workflow"
                  width={1536}
                  height={1024}
                  priority
                />
              </div>
              <div className="phone-frame">
                <Image
                  src="/pulsefill-ios.png"
                  alt="PulseFill iOS customer appointment update screen"
                  width={1536}
                  height={1024}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="ms-section ms-section--path" aria-labelledby="path-heading">
        <div className="ms-section-inner">
          <div className="ms-section-head">
            <p className="eyebrow" id="path-eyebrow">
              End-to-end recovery
            </p>
            <h2 id="path-heading">Opening → standby → offer → claim → confirm</h2>
            <p className="ms-lede">
              One operator story: capture the cancellation, scan standby preferences, notify the right customers, lock a
              claim, and confirm the booking.
            </p>
          </div>
          <MarketingRecoveryBlock activeStep="offers" compact={false} />
        </div>
      </section>

      <section className="metrics" aria-label="Operational outcomes">
        {outcomes.map((item) => (
          <article key={item.label}>
            <p>{item.label}</p>
            <strong>{item.value}</strong>
          </article>
        ))}
      </section>

      <section className="ms-section ms-section--operator" aria-labelledby="operator-heading">
        <div className="ms-section-inner">
          <div className="ms-section-head">
            <p className="eyebrow">Operator OS</p>
            <h2 id="operator-heading">The same command surfaces your team lives in.</h2>
            <p className="ms-lede">Warm charcoal panels, ember actions, and explainable recovery — not generic admin chrome.</p>
          </div>
          <div className="ms-operator-grid">
            {operatorTiles.map((t) => (
              <article key={t.title} className="ms-operator-card">
                <h3>{t.title}</h3>
                <p>{t.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="ms-section ms-section--standby" aria-labelledby="standby-heading">
        <div className="ms-section-inner ms-standby-grid">
          <div>
            <p className="eyebrow">Customer standby</p>
            <h2 id="standby-heading">Patients raise their hand. You keep control.</h2>
            <p className="ms-lede">
              Preferences, timing, and consent stay structured so offers go to the right people — without spamming the
              whole list.
            </p>
          </div>
          <div className="ms-standby-panel">
            <p className="pf-kicker" style={{ margin: "0 0 10px" }}>
              What customers feel
            </p>
            <ul className="ms-standby-list">
              <li>Clear offer windows and fair ordering</li>
              <li>One-tap claim when an opening fits</li>
              <li>Confidence that the desk confirmed the booking</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="ms-section ms-section--pilot" aria-labelledby="pilot-heading">
        <div className="ms-section-inner ms-pilot">
          <div>
            <h2 id="pilot-heading">Pilot PulseFill on your busiest days.</h2>
            <p className="ms-lede" style={{ marginBottom: 0 }}>
              Book a walkthrough — we will map cancellations, standby, and staff confirmation to your workflow.
            </p>
          </div>
          <div className="ms-pilot-actions">
            <Link className="button primary" href="/demo">
              Book a demo
            </Link>
            <Link className="button secondary" href="/contact">
              Contact sales
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
