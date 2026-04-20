"use client";

import { useState } from "react";
import type { OperatorFiltersState, SavedOperatorView } from "@/types/operator-filters";

type Props = {
  views: SavedOperatorView[];
  onApply: (filters: OperatorFiltersState) => void;
  onCreate: (name: string) => void;
  onDelete: (id: string) => void;
};

export function OperatorSavedViews({ views, onApply, onCreate, onDelete }: Props) {
  const [name, setName] = useState("");

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Save current view"
          style={{
            borderRadius: 12,
            padding: "10px 12px",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            color: "var(--text)",
            minWidth: 200,
          }}
        />
        <button
          type="button"
          onClick={() => {
            const trimmed = name.trim();
            if (!trimmed) return;
            onCreate(trimmed);
            setName("");
          }}
          style={{
            borderRadius: 999,
            padding: "9px 12px",
            border: "1px solid rgba(255,255,255,0.08)",
            background: "rgba(255,255,255,0.10)",
            color: "var(--text)",
            cursor: "pointer",
          }}
        >
          Save view
        </button>
      </div>

      {views.length > 0 ? (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {views.map((view) => (
            <div
              key={view.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                borderRadius: 999,
                padding: "8px 10px",
                border: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(255,255,255,0.03)",
              }}
            >
              <button
                type="button"
                onClick={() => onApply(view.filters)}
                style={{
                  background: "transparent",
                  border: 0,
                  cursor: "pointer",
                  color: "var(--text)",
                }}
              >
                {view.name}
              </button>
              <button
                type="button"
                onClick={() => onDelete(view.id)}
                style={{
                  background: "transparent",
                  border: 0,
                  cursor: "pointer",
                  opacity: 0.7,
                  color: "var(--text)",
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
