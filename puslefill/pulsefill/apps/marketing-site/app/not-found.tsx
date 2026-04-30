import Link from "next/link";

export default function NotFound() {
  return (
    <main className="ms-not-found">
      <p className="pf-kicker" style={{ margin: "0 0 12px" }}>
        PulseFill
      </p>
      <h1 style={{ margin: 0, fontSize: "clamp(28px, 5vw, 40px)", fontWeight: 800, letterSpacing: "-0.03em" }}>Page not found</h1>
      <p className="ms-not-found-copy">
        This URL is not part of the marketing site. Check the link or return to the homepage.
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 22 }}>
        <Link className="button primary" href="/">
          Home
        </Link>
        <Link className="button secondary" href="/contact">
          Contact
        </Link>
      </div>
    </main>
  );
}
