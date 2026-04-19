export default function HomePage() {
  return (
    <main style={{ padding: 48, maxWidth: 980, margin: "0 auto" }}>
      <p style={{ color: "var(--muted)", letterSpacing: 1.2, textTransform: "uppercase", fontSize: 12 }}>
        Cancellation recovery for appointment businesses
      </p>
      <h1 style={{ fontSize: 44, lineHeight: 1.05, margin: "12px 0 16px" }}>Recover cancelled appointments in minutes.</h1>
      <p style={{ color: "var(--muted)", fontSize: 18, lineHeight: 1.5, maxWidth: 720 }}>
        PulseFill matches last-minute openings to standby customers, sends offers, and awards the first valid claim—without
        front-desk phone tag.
      </p>
      <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
        <a href="/pricing">Pricing</a>
        <a href="/demo">Demo</a>
        <a href="/contact">Contact</a>
      </div>
    </main>
  );
}
