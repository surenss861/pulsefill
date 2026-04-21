"use client";

export function ActionQueueEmptyState({ title, body }: { title: string; body?: string }) {
  return (
    <div
      style={{
        borderRadius: 12,
        border: "1px dashed rgba(255,255,255,0.12)",
        padding: 20,
        color: "var(--muted)",
        fontSize: 14,
      }}
    >
      <div style={{ fontWeight: 600, color: "var(--text)", marginBottom: body ? 6 : 0 }}>{title}</div>
      {body ? <div>{body}</div> : null}
    </div>
  );
}
