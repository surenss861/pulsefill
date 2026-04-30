import type { ReactNode } from "react";

const ambient = {
  position: "absolute" as const,
  inset: 0,
  pointerEvents: "none" as const,
  background: `
    radial-gradient(circle at 72% 12%, rgba(255, 122, 24, 0.14), transparent 34%),
    radial-gradient(circle at 10% 88%, rgba(201, 59, 47, 0.08), transparent 28%),
    linear-gradient(180deg, #040302 0%, #0a0908 45%, #060504 100%)
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
          <div className="pf-auth-shell-enter" style={{ width: "100%", maxWidth: 440 }}>
            {children}
          </div>
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
              borderRight: "1px solid rgba(255,255,255,0.07)",
              alignItems: "stretch",
              background:
                "linear-gradient(165deg, rgba(255,122,24,0.05), transparent 42%), linear-gradient(180deg, rgba(12,10,9,0.65), rgba(4,3,2,0.92))",
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
              <div className="pf-auth-shell-enter" style={{ width: "100%", maxWidth: 540 }}>
                {brandPanel}
              </div>
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
            <div className="pf-auth-shell-enter" style={{ width: "100%", maxWidth: 460 }}>
              {children}
            </div>
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
