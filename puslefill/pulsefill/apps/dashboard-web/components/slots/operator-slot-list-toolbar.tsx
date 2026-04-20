"use client";

import type { OperatorSlotsFilter } from "@/types/operator-slots-list";
import { OPERATOR_SLOT_FILTERS } from "@/lib/operator-slots-ui";

type Props = {
  selectedFilter: OperatorSlotsFilter;
  onChange: (value: OperatorSlotsFilter) => void;
  counts: Record<string, number>;
};

export function OperatorSlotListToolbar({
  selectedFilter,
  onChange,
  counts,
}: Props) {
  return (
    <div
      style={{
        display: "flex",
        gap: 8,
        flexWrap: "wrap",
      }}
    >
      {OPERATOR_SLOT_FILTERS.map((filter) => {
        const active = filter.key === selectedFilter;
        const count = counts[filter.key] ?? 0;

        return (
          <button
            key={filter.key}
            type="button"
            onClick={() => onChange(filter.key)}
            style={{
              borderRadius: 999,
              padding: "9px 12px",
              border: active ? "1px solid rgba(255,255,255,0.18)" : "1px solid rgba(255,255,255,0.08)",
              background: active ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.03)",
              cursor: "pointer",
              color: "var(--text)",
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 600 }}>{filter.label}</span>
            <span style={{ fontSize: 12, opacity: 0.7, marginLeft: 8 }}>{count}</span>
          </button>
        );
      })}
    </div>
  );
}
