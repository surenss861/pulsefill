"use client";

type Props = {
  updatedAt: Date | null;
};

/** Subtle “data is fresh” cue after silent reloads. */
export function RefreshIndicator({ updatedAt }: Props) {
  if (!updatedAt) return null;

  return (
    <p style={{ margin: 0, fontSize: 12, color: "var(--muted)", opacity: 0.85 }}>
      Updated{" "}
      {updatedAt.toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
      })}
    </p>
  );
}
