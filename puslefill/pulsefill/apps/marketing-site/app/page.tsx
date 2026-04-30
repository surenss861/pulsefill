import Image from "next/image";
import Link from "next/link";

const outcomes = [
  { label: "Standby reach", value: "2.4k" },
  { label: "Avg. claim time", value: "6m" },
  { label: "Recovered revenue", value: "$18.6k" },
];

const workflow = [
  "Capture the cancellation",
  "Match qualified standby customers",
  "Send timed offers",
  "Confirm the first valid claim",
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

        <div className="hero-grid">
          <div className="hero-copy">
            <p className="eyebrow">Cancellation recovery for appointment teams</p>
            <h1>Recover cancelled appointments before the calendar goes cold.</h1>
            <p className="hero-lede">
              PulseFill turns last-minute openings into fast, qualified claims with standby matching, offer timing,
              and confirmation workflows built for busy front desks.
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
      </section>

      <section className="metrics" aria-label="Operational outcomes">
        {outcomes.map((item) => (
          <article key={item.label}>
            <p>{item.label}</p>
            <strong>{item.value}</strong>
          </article>
        ))}
      </section>

      <section className="workflow">
        <div>
          <p className="eyebrow">Live fill workflow</p>
          <h2>One operator flow from cancellation to confirmed booking.</h2>
        </div>
        <ol>
          {workflow.map((step) => (
            <li key={step}>
              <span>{String(workflow.indexOf(step) + 1).padStart(2, "0")}</span>
              {step}
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
