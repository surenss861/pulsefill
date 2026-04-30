import Link from "next/link";

const actions = [
  {
    title: "Open queue",
    body: "Work the hottest active recovery items first.",
    href: "/action-queue?section=needs_action",
  },
  {
    title: "Review openings",
    body: "Inspect inventory and state across all openings.",
    href: "/open-slots",
  },
  {
    title: "Inspect failed outcomes",
    body: "Start with the openings that leaked through recovery.",
    href: "/open-slots?attention=needs_action",
  },
] as const;

export function OutcomesActionStrip() {
  return (
    <section
      style={{
        borderRadius: 24,
        border: "1px solid var(--pf-border-subtle)",
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.032), rgba(255,122,24,0.012)), var(--pf-bg-surface)",
        padding: "16px 18px",
      }}
    >
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        {actions.map((action) => (
          <Link
            key={action.title}
            href={action.href}
            style={{
              flex: "1 1 200px",
              minWidth: 0,
              display: "block",
              borderRadius: 16,
              border: "1px solid var(--pf-border-subtle)",
              background: "rgba(255,255,255,0.02)",
              padding: 16,
              textDecoration: "none",
              color: "inherit",
              transition: "border-color 0.15s ease, background 0.15s ease",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "rgba(245, 247, 250, 0.88)" }}>{action.title}</p>
              <span style={{ color: "#ffb070", fontSize: 14 }}>→</span>
            </div>
            <p style={{ margin: "10px 0 0", fontSize: 13, lineHeight: 1.5, color: "rgba(245, 247, 250, 0.55)" }}>{action.body}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
