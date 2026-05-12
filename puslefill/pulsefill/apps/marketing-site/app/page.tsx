import Link from "next/link";
import { HeroOperatorConsole } from "../components/hero-operator-console";
import { MarketingRecoveryBlock } from "../components/marketing-recovery-block";

const outcomes = [
  { label: "Bookings recovered (pilot)", value: "127" },
  { label: "Median time to first claim", value: "6m" },
  { label: "Revenue retained", value: "$18.6k" },
];

const operatorTiles = [
  {
    title: "Recovery queue",
    body: "See what cancelled, what’s offered, and what still needs a confirmation tap — one list instead of side threads.",
  },
  {
    title: "Openings & claims",
    body: "Turn a freed 2:30 slot into a claimed visit with timed offers and a clear claim owner before you move on.",
  },
  {
    title: "Customers & activity",
    body: "Who’s on standby, who received the offer, and who the desk confirmed — with timestamps you can stand behind.",
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
            <p className="eyebrow">Appointment recovery operating system</p>
            <h1>Recover cancelled appointments before the day is lost.</h1>
            <p className="hero-lede">
              PulseFill turns your waiting list into claimed bookings when cancellations happen.
            </p>
            <div className="hero-actions">
              <Link className="button primary" href="/demo">
                Book a demo
              </Link>
              <Link className="button secondary" href="/#path-heading">
                See how it works
              </Link>
            </div>
            <div className="segment-row" aria-label="Supported appointment businesses">
              {segments.map((segment) => (
                <span key={segment}>{segment}</span>
              ))}
            </div>
          </div>

          <div className="hero-visual-column">
            <HeroOperatorConsole />
          </div>
        </div>
      </section>

      <section className="ms-section ms-section--path" aria-labelledby="path-heading">
        <div className="ms-section-inner">
          <div className="ms-section-head">
            <p className="eyebrow" id="path-eyebrow">
              One workflow
            </p>
            <h2 id="path-heading">Cancelled slot → waitlist → claim → confirmed booking</h2>
            <p className="ms-lede">
              A patient cancels. PulseFill matches your waitlist, sends a timed offer to the right people, captures who
              claimed, and leaves the front desk with a single confirmation step before revenue walks out the door.
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
            <p className="eyebrow">For front desk &amp; ops</p>
            <h2 id="operator-heading">One console for openings, claims, and customers.</h2>
            <p className="ms-lede">
              Built for the people who answer the phone: fewer tabs, less guesswork, and a straight line from
              cancellation to recovered revenue.
            </p>
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
            <h2 id="standby-heading">Waitlist without inbox chaos.</h2>
            <p className="ms-lede">
              Patients set preferences once. When a slot opens, the right people are offered first — you still decide who
              gets the chair.
            </p>
          </div>
          <div className="ms-standby-panel">
            <p className="pf-kicker" style={{ margin: "0 0 10px" }}>
              Patient experience
            </p>
            <ul className="ms-standby-list">
              <li>Offer window and queue position — not a blast to everyone on file.</li>
              <li>One tap to claim when the time and service match what they asked for.</li>
              <li>Clear status when the desk has confirmed so they’re not left guessing.</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="ms-section ms-section--pilot" aria-labelledby="pilot-heading">
        <div className="ms-section-inner ms-pilot">
          <div>
            <h2 id="pilot-heading">Try it on your heaviest cancellation days.</h2>
            <p className="ms-lede" style={{ marginBottom: 0 }}>
              Book a walkthrough: we’ll map how cancellations hit your calendar, how waitlists are managed today, and how
              your team confirms in under a minute.
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
