"use client";

import Link from "next/link";
import { slotsDetailPath } from "@/lib/open-slot-routes";
import type { BulkSlotActionResponse } from "@/types/bulk-actions";

type Props = {
  result: BulkSlotActionResponse | null;
  onDismiss: () => void;
};

export function OperatorBulkActionResult({ result, onDismiss }: Props) {
  if (!result) return null;

  const { summary, message, results } = result;
  const notable = results.filter((r) => r.status !== "processed").slice(0, 6);

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        background: "rgba(0,0,0,0.65)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <div
        style={{
          width: "min(480px, 100%)",
          borderRadius: 20,
          border: "1px solid rgba(255,255,255,0.1)",
          background: "var(--surface)",
          padding: 22,
          maxHeight: "min(80vh, 560px)",
          overflow: "auto",
        }}
      >
        <h2 style={{ margin: 0, fontSize: 18 }}>Bulk action complete</h2>
        <p style={{ margin: "10px 0 0", fontSize: 14, color: "var(--muted)", lineHeight: 1.5 }}>{message}</p>

        <ul style={{ margin: "16px 0 0", paddingLeft: 18, fontSize: 14, lineHeight: 1.6 }}>
          <li>
            <strong>{summary.processed}</strong> processed
          </li>
          <li>
            <strong>{summary.skipped}</strong> skipped
          </li>
          <li>
            <strong>{summary.failed}</strong> failed
          </li>
          <li style={{ color: "var(--muted)", fontSize: 13 }}>Requested: {summary.requested}</li>
        </ul>

        {notable.length > 0 ? (
          <div style={{ marginTop: 16 }}>
            <p style={{ margin: 0, fontSize: 12, color: "var(--muted)", letterSpacing: "0.04em" }}>SAMPLE SKIPS / FAILURES</p>
            <ul style={{ margin: "8px 0 0", padding: 0, listStyle: "none", fontSize: 13 }}>
              {notable.map((r) => (
                <li
                  key={`${r.open_slot_id}-${r.status}-${r.code ?? ""}`}
                  style={{
                    padding: "8px 0",
                    borderBottom: "1px solid rgba(255,255,255,0.06)",
                    color: "var(--text)",
                  }}
                >
                  <Link
                    href={slotsDetailPath(r.open_slot_id, {})}
                    prefetch={false}
                    style={{ color: "#ffb070", fontWeight: 600, textDecoration: "none" }}
                  >
                    Open detail
                  </Link>
                  <span style={{ color: "var(--muted)", fontWeight: 500 }}>
                    {" "}
                    ({String(r.open_slot_id).slice(0, 8)}…)
                  </span>{" "}
                  · {r.status}
                  {r.code ? <span style={{ color: "var(--muted)" }}> · {r.code}</span> : null}
                  {r.message ? <div style={{ color: "var(--muted)", marginTop: 4 }}>{r.message}</div> : null}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div style={{ marginTop: 20, display: "flex", justifyContent: "flex-end" }}>
          <button
            type="button"
            onClick={onDismiss}
            style={{
              borderRadius: 12,
              padding: "10px 18px",
              border: "none",
              background: "var(--primary)",
              color: "#0a0c10",
              fontWeight: 650,
              cursor: "pointer",
            }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
