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
    <div style={{ display: "grid", gap: 14, marginTop: 4 }}>
      <div>
        <p className="pf-desk-invite-label" style={{ margin: "0 0 10px" }}>
          Saved views
          <span className="pf-desk-invite-label__hint">Save this combination of provider, location, and visit type to reuse later.</span>
        </p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "stretch" }}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name this view (e.g. Dr. Lee — downtown cleanings)"
            aria-label="Name for saved view"
            className="pf-desk-invite-input"
            style={{ flex: "1 1 240px", minWidth: 0 }}
          />
          <button
            type="button"
            onClick={() => {
              const trimmed = name.trim();
              if (!trimmed) return;
              onCreate(trimmed);
              setName("");
            }}
            className="pf-desk-save-access"
            style={{ alignSelf: "center" }}
          >
            Save view
          </button>
        </div>
      </div>

      {views.length > 0 ? (
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <span className="pf-muted-copy" style={{ fontSize: 13, width: "100%", margin: 0 }}>
            Tap a view to apply it. Remove deletes it from this device only.
          </span>
          {views.map((view) => (
            <div key={view.id} className="pf-desk-saved-view-chip">
              <button type="button" className="pf-desk-saved-view-chip__apply" onClick={() => onApply(view.filters)}>
                {view.name}
              </button>
              <button
                type="button"
                className="pf-desk-saved-view-chip__remove"
                onClick={() => onDelete(view.id)}
                aria-label={`Remove saved view ${view.name}`}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
