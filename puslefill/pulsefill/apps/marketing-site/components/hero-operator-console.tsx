export function HeroOperatorConsole() {
  return (
    <div className="ms-hero-console" aria-label="Operator recovery console preview">
      <header className="ms-hero-console-top">
        <div className="ms-hero-console-dots" aria-hidden>
          <span />
          <span />
          <span />
        </div>
        <p className="ms-hero-console-app-name">PulseFill</p>
      </header>
      <div className="ms-hero-console-body">
        <section className="ms-hero-console-col" aria-labelledby="hero-console-col-today">
          <h3 className="ms-hero-console-col-title" id="hero-console-col-today">
            Today
          </h3>
          <p className="ms-hero-console-muted">Cancelled appointment</p>
          <p className="ms-hero-console-strong">Dental cleaning</p>
          <p className="ms-hero-console-meta">Today · 2:30 PM</p>
          <p className="ms-hero-console-value-label">Slot value</p>
          <p className="ms-hero-console-value">$185</p>
        </section>
        <div className="ms-hero-console-divider ms-hero-console-divider--v" aria-hidden />
        <section className="ms-hero-console-col" aria-labelledby="hero-console-col-waitlist">
          <h3 className="ms-hero-console-col-title" id="hero-console-col-waitlist">
            Waiting list
          </h3>
          <p className="ms-hero-console-line">
            <span className="ms-hero-console-num">9</span> matched customers
          </p>
          <p className="ms-hero-console-line">
            <span className="ms-hero-console-num">3</span> offers sent
          </p>
          <div className="ms-hero-console-claim">
            <p className="ms-hero-console-muted">Claim</p>
            <p className="ms-hero-console-strong">Maya R. claimed 3 min ago</p>
          </div>
        </section>
        <div className="ms-hero-console-divider ms-hero-console-divider--v" aria-hidden />
        <section className="ms-hero-console-col" aria-labelledby="hero-console-col-next">
          <h3 className="ms-hero-console-col-title" id="hero-console-col-next">
            Next action
          </h3>
          <p className="ms-hero-console-prompt">
            Maya R. claimed the 2:30 PM cleaning. Confirm booking to recover{" "}
            <span className="ms-hero-console-money">$185</span>.
          </p>
          <button type="button" className="ms-hero-console-btn">
            Confirm booking
          </button>
          <p className="ms-hero-console-foot">Recovered in 3 min after cancellation</p>
        </section>
      </div>
    </div>
  );
}
