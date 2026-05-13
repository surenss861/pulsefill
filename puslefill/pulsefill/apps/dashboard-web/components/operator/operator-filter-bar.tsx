"use client";

import { useMemo } from "react";
import type { OperatorFilterOption, OperatorFiltersState } from "@/types/operator-filters";

type Props = {
  filters: OperatorFiltersState;
  onChange: (next: OperatorFiltersState) => void;
  /** When set, shows "Clear filters" whenever any dimension filter is active. */
  onClear?: () => void;
  providers: OperatorFilterOption[];
  locations: OperatorFilterOption[];
  services: OperatorFilterOption[];
};

function SelectField({
  label,
  hint,
  value,
  options,
  emptyLabel,
  onChange,
}: {
  label: string;
  hint: string;
  value: string | null;
  options: OperatorFilterOption[];
  emptyLabel: string;
  onChange: (value: string | null) => void;
}) {
  return (
    <label className="pf-desk-invite-label">
      <span>{label}</span>
      <span className="pf-desk-invite-label__hint">{hint}</span>
      <select
        className="pf-desk-invite-input"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value || null)}
      >
        <option value="">{emptyLabel}</option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function OperatorFilterBar({
  filters,
  onChange,
  onClear,
  providers,
  locations,
  services,
}: Props) {
  const hasActiveFilters = useMemo(
    () =>
      Boolean(filters.providerId || filters.locationId || filters.serviceId),
    [filters.providerId, filters.locationId, filters.serviceId],
  );

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10 }}>
        <p className="pf-muted-copy" style={{ margin: 0, flex: "1 1 220px", fontSize: 14, lineHeight: 1.55 }}>
          Narrow by provider, location, or visit type. Combine with status above to find the opening you need.
        </p>
        {onClear && hasActiveFilters ? (
          <button type="button" className="pf-desk-quiet-link" onClick={onClear} style={{ fontSize: 14, whiteSpace: "nowrap" }}>
            Clear filters
          </button>
        ) : null}
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 14,
        }}
      >
        <SelectField
          label="Provider"
          hint="Who is treating on this opening."
          emptyLabel="Any provider"
          value={filters.providerId}
          options={providers}
          onChange={(providerId) => onChange({ ...filters, providerId })}
        />

        <SelectField
          label="Location"
          hint="Which site or room matters for this list."
          emptyLabel="Any location"
          value={filters.locationId}
          options={locations}
          onChange={(locationId) => onChange({ ...filters, locationId })}
        />

        <SelectField
          label="Visit type"
          hint="Match a specific service or appointment type."
          emptyLabel="Any visit type"
          value={filters.serviceId}
          options={services}
          onChange={(serviceId) => onChange({ ...filters, serviceId })}
        />
      </div>
    </div>
  );
}
