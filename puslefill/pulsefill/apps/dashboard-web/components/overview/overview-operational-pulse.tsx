"use client";

type Props = {
  /** e.g. daily ops date + timezone */
  contextLine?: string | null;
  note?: string;
};

/**
 * Right-rail “operational pulse” for Overview hero — today’s framing + coverage context.
 */
export function OverviewOperationalPulse({
  contextLine,
  note = "Live view of today's cancellation recovery workflow.",
}: Props) {
  return (
    <div
      style={{
        borderRadius: 16,
        border: "1px solid rgba(255,255,255,0.1)",
        background: "rgba(0,0,0,0.2)",
        padding: 16,
        minHeight: 120,
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: "var(--muted)",
          opacity: 0.85,
        }}
      >
        Operational pulse
      </div>
      <p style={{ margin: "10px 0 0 0", fontSize: 14, lineHeight: 1.55, color: "var(--text)", opacity: 0.88 }}>
        {note}
      </p>
      {contextLine ? (
        <p style={{ margin: "8px 0 0 0", fontSize: 13, color: "var(--muted)", lineHeight: 1.5 }}>{contextLine}</p>
      ) : null}
    </div>
  );
}
