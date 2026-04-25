"use client";

export type OverviewPulseLine = { label: string; value: string | number };

type Props = {
  /** e.g. daily ops date + timezone */
  contextLine?: string | null;
  note?: string;
  /** Live snapshot rows (queue, today’s ops, inventory pressure). */
  lines?: OverviewPulseLine[] | null;
};

/**
 * Right-rail “operational pulse” for Overview hero — today’s framing + coverage context.
 */
export function OverviewOperationalPulse({
  contextLine,
  note = "Live snapshot from today’s business window and your recovery queue.",
  lines,
}: Props) {
  return (
    <div
      style={{
        borderRadius: 16,
        border: "1px solid rgba(255,255,255,0.1)",
        background: "rgba(0,0,0,0.2)",
        padding: 16,
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
      {lines && lines.length > 0 ? (
        <ul
          style={{
            margin: "12px 0 0 0",
            padding: 0,
            listStyle: "none",
            display: "grid",
            gap: 8,
          }}
        >
          {lines.map((row) => (
            <li
              key={row.label}
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                fontSize: 13,
                lineHeight: 1.45,
                color: "rgba(245, 247, 250, 0.78)",
              }}
            >
              <span style={{ color: "var(--muted)" }}>{row.label}</span>
              <span style={{ fontWeight: 650, fontVariantNumeric: "tabular-nums" }}>{row.value}</span>
            </li>
          ))}
        </ul>
      ) : null}
      {contextLine ? (
        <p style={{ margin: "10px 0 0 0", fontSize: 13, color: "var(--muted)", lineHeight: 1.5 }}>{contextLine}</p>
      ) : null}
    </div>
  );
}
