"use client";

import type { OperatorFilterOption, OperatorFiltersState } from "@/types/operator-filters";

type Props = {
  filters: OperatorFiltersState;
  onChange: (next: OperatorFiltersState) => void;
  providers: OperatorFilterOption[];
  locations: OperatorFilterOption[];
  services: OperatorFilterOption[];
};

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string | null;
  options: OperatorFilterOption[];
  onChange: (value: string | null) => void;
}) {
  return (
    <label style={{ display: "grid", gap: 6 }}>
      <span style={{ fontSize: 12, opacity: 0.72 }}>{label}</span>
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value || null)}
        style={{
          borderRadius: 12,
          padding: "10px 12px",
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          color: "var(--text)",
        }}
      >
        <option value="">All</option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function OperatorFilterBar({ filters, onChange, providers, locations, services }: Props) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        gap: 12,
      }}
    >
      <SelectField
        label="Provider"
        value={filters.providerId}
        options={providers}
        onChange={(providerId) => onChange({ ...filters, providerId })}
      />

      <SelectField
        label="Location"
        value={filters.locationId}
        options={locations}
        onChange={(locationId) => onChange({ ...filters, locationId })}
      />

      <SelectField
        label="Service"
        value={filters.serviceId}
        options={services}
        onChange={(serviceId) => onChange({ ...filters, serviceId })}
      />
    </div>
  );
}
