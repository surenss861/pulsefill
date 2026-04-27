type AuthBrandPanelProps = {
  eyebrow?: string;
  title: string;
  body: string;
  bullets?: string[];
  showRecoveryStrip?: boolean;
};

export function AuthBrandPanel({
  eyebrow = "Appointment recovery operating system",
  title,
  body,
  bullets = ["Queue visibility", "Explainable actions", "Recovery signals live"],
  showRecoveryStrip = true,
}: AuthBrandPanelProps) {
  return (
    <div style={{ display: "grid", gap: 32 }}>
      <div style={{ display: "grid", gap: 28 }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: 999,
              background: "var(--pf-accent-primary)",
              boxShadow: "0 0 18px rgba(255, 122, 24, 0.55)",
            }}
          />
          <span style={{ fontSize: 14, fontWeight: 600, letterSpacing: "0.18em", color: "rgba(245,247,250,0.9)" }}>
            PulseFill
          </span>
        </div>

        <div style={{ display: "grid", gap: 16 }}>
          <p
            style={{
              margin: 0,
              fontSize: 11,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.24em",
              color: "rgba(245,247,250,0.46)",
            }}
          >
            {eyebrow}
          </p>
          <h1
            style={{
              margin: 0,
              maxWidth: "12ch",
              fontSize: "clamp(40px, 4.2vw, 72px)",
              fontWeight: 620,
              lineHeight: 0.92,
              letterSpacing: "-0.055em",
              color: "var(--text)",
            }}
          >
            {title}
          </h1>
          <p
            style={{
              margin: 0,
              maxWidth: "32rem",
              fontSize: 16,
              lineHeight: 1.65,
              color: "rgba(245,247,250,0.66)",
            }}
          >
            {body}
          </p>
        </div>
      </div>

      {bullets.length > 0 ? (
        <div style={{ display: "grid", gap: 10 }}>
          {bullets.map((item) => (
            <div
              key={item}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                borderRadius: 16,
                border: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(255,255,255,0.02)",
                padding: "14px 16px",
                backdropFilter: "blur(8px)",
              }}
            >
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 999,
                  background: "var(--pf-accent-primary)",
                  flexShrink: 0,
                }}
              />
              <span style={{ fontSize: 14, color: "rgba(245,247,250,0.82)" }}>{item}</span>
            </div>
          ))}
        </div>
      ) : null}

      {showRecoveryStrip ? (
        <div
          style={{
            borderRadius: 28,
            border: "1px solid rgba(255, 122, 24, 0.2)",
            background: "linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.015))",
            padding: 20,
            boxShadow: "0 30px 80px rgba(0,0,0,0.45)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.2em",
                color: "rgba(245,247,250,0.42)",
              }}
            >
              Today&apos;s recovery
            </span>
            <span
              style={{
                fontSize: 10,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.14em",
                color: "rgba(253, 186, 116, 0.88)",
                border: "1px solid rgba(255, 122, 24, 0.22)",
                background: "rgba(255, 122, 24, 0.08)",
                padding: "4px 9px",
                borderRadius: 999,
              }}
            >
              live
            </span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
            {[
              ["Recovered", "12"],
              ["Revenue", "$1.8K"],
              ["Awaiting", "4"],
            ].map(([label, value]) => (
              <div
                key={label}
                style={{
                  borderRadius: 16,
                  border: "1px solid rgba(255, 122, 24, 0.18)",
                  background: "#0a0d12",
                  padding: 14,
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    textTransform: "uppercase",
                    letterSpacing: "0.16em",
                    color: "rgba(245,247,250,0.38)",
                  }}
                >
                  {label}
                </div>
                <div style={{ marginTop: 10, fontSize: 28, fontWeight: 620, letterSpacing: "-0.04em" }}>{value}</div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
