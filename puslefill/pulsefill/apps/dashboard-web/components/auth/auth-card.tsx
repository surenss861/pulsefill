import type { ReactNode } from "react";

type AuthCardProps = {
  overtitle?: string;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  showMobileWordmark?: boolean;
};

export function AuthCard({
  overtitle,
  title,
  description,
  children,
  footer,
  showMobileWordmark = true,
}: AuthCardProps) {
  return (
    <div
      style={{
        borderRadius: 30,
        border: "1px solid rgba(255,255,255,0.08)",
        background: "linear-gradient(180deg, rgba(15,18,28,0.92), rgba(8,10,18,0.96))",
        padding: "clamp(28px, 4vw, 40px)",
        boxShadow: "0 40px 120px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.04)",
        backdropFilter: "blur(20px)",
      }}
    >
      <div style={{ marginBottom: 28, display: "grid", gap: 12 }}>
        {showMobileWordmark ? (
          <div
            className="auth-card-mobile-mark"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: 999,
                background: "var(--pf-accent-primary)",
              }}
            />
            <span style={{ fontSize: 13, fontWeight: 600, letterSpacing: "0.16em", color: "rgba(245,247,250,0.88)" }}>
              PulseFill
            </span>
          </div>
        ) : null}
        {overtitle ? (
          <p
            style={{
              margin: 0,
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: "rgba(245,247,250,0.42)",
            }}
          >
            {overtitle}
          </p>
        ) : null}
        <h2
          style={{
            margin: 0,
            fontSize: "clamp(26px, 3.2vw, 36px)",
            fontWeight: 620,
            letterSpacing: "-0.045em",
            color: "var(--text)",
          }}
        >
          {title}
        </h2>
        {description ? (
          <p style={{ margin: 0, maxWidth: "38ch", fontSize: 14, lineHeight: 1.55, color: "var(--muted)" }}>{description}</p>
        ) : null}
      </div>

      <div style={{ display: "grid", gap: 20 }}>{children}</div>

      {footer ? (
        <div style={{ marginTop: 28, paddingTop: 20, borderTop: "1px solid rgba(255,255,255,0.08)" }}>{footer}</div>
      ) : null}
      <style>{`
        @media (min-width: 1024px) {
          .auth-card-mobile-mark { display: none !important; }
        }
      `}</style>
    </div>
  );
}
