import type { ReactNode } from "react";

const ambient = {
  position: "absolute" as const,
  inset: 0,
  pointerEvents: "none" as const,
  background: `
    radial-gradient(circle at 72% 14%, rgba(255, 122, 24, 0.12), transparent 32%),
    radial-gradient(circle at 8% 92%, rgba(158, 42, 31, 0.1), transparent 26%),
    linear-gradient(180deg, #050505 0%, #060606 48%, #050505 100%)
  `,
};

const gridNoise = {
  position: "absolute" as const,
  inset: 0,
  opacity: 0.05,
  backgroundImage: `linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)`,
  backgroundSize: "32px 32px",
  pointerEvents: "none" as const,
};

export type AuthShellVariant = "split" | "center";

export function AuthShell({
  children,
  brandPanel,
  variant = "split",
}: {
  children: ReactNode;
  brandPanel?: ReactNode;
  variant?: AuthShellVariant;
}) {
  if (variant === "center") {
    return (
      <main
        style={{
          position: "relative",
          minHeight: "100vh",
          overflow: "hidden",
          background: "var(--pf-bg-app)",
          color: "var(--text)",
        }}
      >
        <div aria-hidden style={ambient} />
        <div aria-hidden style={gridNoise} />
        <div
          style={{
            position: "relative",
            zIndex: 1,
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "40px 20px",
          }}
        >
          <div style={{ width: "100%", maxWidth: 440 }}>{children}</div>
        </div>
      </main>
    );
  }

  return (
    <main
      style={{
        position: "relative",
        minHeight: "100vh",
        overflow: "hidden",
        background: "var(--pf-bg-app)",
        color: "var(--text)",
      }}
    >
      <div aria-hidden style={ambient} />
      <div aria-hidden style={gridNoise} />
      <div
        style={{
          position: "relative",
          zIndex: 1,
          margin: "0 auto",
          display: "flex",
          minHeight: "100vh",
          maxWidth: 1440,
          flexDirection: "column",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr",
            flex: 1,
          }}
          className="auth-split-grid"
        >
          <section
            style={{
              display: "none",
              borderRight: "1px solid rgba(255,255,255,0.06)",
              alignItems: "stretch",
            }}
            className="auth-brand-section"
          >
            <div
              style={{
                display: "flex",
                width: "100%",
                alignItems: "center",
                padding: "clamp(32px, 4vw, 64px) clamp(28px, 4vw, 56px) clamp(32px, 4vw, 64px) clamp(24px, 3vw, 48px)",
              }}
            >
              <div style={{ width: "100%", maxWidth: 540 }}>{brandPanel}</div>
            </div>
          </section>

          <section
            style={{
              display: "flex",
              minHeight: "100vh",
              alignItems: "center",
              justifyContent: "center",
              padding: "40px 20px",
            }}
            className="auth-form-section"
          >
            <div style={{ width: "100%", maxWidth: 460 }}>{children}</div>
          </section>
        </div>
      </div>
      <style>{`
        @media (min-width: 1024px) {
          .auth-split-grid {
            grid-template-columns: 1.05fr 0.95fr !important;
          }
          .auth-brand-section {
            display: flex !important;
          }
        }
      `}</style>
    </main>
  );
}
