"use client";

import Link from "next/link";
import { useState } from "react";
import type { CSSProperties } from "react";
import { PageCommandHeader } from "@/components/operator/page-command-header";
import { OperatorEmptyState } from "@/components/operator/operator-empty-state";
import { actionLinkStyle } from "@/lib/operator-action-link-styles";
import { useStaffArrayResource } from "@/hooks/useStaffArrayResource";
import { apiFetch } from "@/lib/api";
import { operatorSurfaceShell } from "@/lib/operator-surface-styles";

type LocationRow = { id: string; name: string; city: string | null };

const inputStyle: CSSProperties = {
  borderRadius: 10,
  border: "1px solid rgba(255,255,255,0.14)",
  background: "var(--pf-auth-input-bg)",
  color: "var(--text)",
  padding: "10px 12px",
  fontSize: 14,
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
};

export default function LocationsPage() {
  const { items, loading, error, reload } = useStaffArrayResource("/v1/locations");
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const locations = (Array.isArray(items) ? items : []) as LocationRow[];

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!name.trim()) {
      setFormError("Name is required.");
      return;
    }
    setSaving(true);
    try {
      await apiFetch<LocationRow>("/v1/locations", {
        method: "POST",
        body: JSON.stringify({
          name: name.trim(),
          ...(city.trim() ? { city: city.trim() } : {}),
        }),
      });
      setName("");
      setCity("");
      await reload();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to create location");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="pf-page-locations" style={{ padding: 0 }}>
      <PageCommandHeader
        animate={false}
        tone="default"
        eyebrow="Workspace"
        title="Locations"
        description="Manage where openings can be recovered. Locations help route staff and customers to the right place."
        primaryAction={
          <Link href="#add-location" style={actionLinkStyle("primary")}>
            Add location
          </Link>
        }
        style={{ marginBottom: 16 }}
      />

      <div
        style={{
          display: "grid",
          gap: 14,
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))",
        }}
      >
        <form
          id="add-location"
          onSubmit={onSubmit}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
            padding: 18,
            ...operatorSurfaceShell("operational"),
          }}
        >
          <h2 className="pf-section-title" style={{ fontSize: 15 }}>
            New location
          </h2>
          <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13 }}>
            <span className="pf-op-field-label">Name *</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Yorkville Clinic"
              required
              style={inputStyle}
            />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13 }}>
            <span className="pf-op-field-label">City (optional)</span>
            <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Toronto" style={inputStyle} />
          </label>
          {formError ? <p style={{ color: "#f87171", margin: 0, fontSize: 13 }}>{formError}</p> : null}
          <button type="submit" disabled={saving} style={submitStyle(saving)}>
            {saving ? "Saving…" : "Save location"}
          </button>
        </form>

        <div style={{ padding: 18, ...operatorSurfaceShell("quiet") }}>
          <h2 className="pf-section-title" style={{ fontSize: 15 }}>
            Why locations matter
          </h2>
          <p className="pf-muted-copy" style={{ margin: "8px 0 0" }}>
            Locations help route openings to the right clinic and improve standby matching.
          </p>
        </div>
      </div>

      {loading ? (
        <p className="pf-muted-copy" style={{ marginTop: 22 }}>
          Loading…
        </p>
      ) : null}
      {error ? <p style={{ color: "#f87171", marginTop: 16 }}>{error}</p> : null}

      {!loading && locations.length === 0 ? (
        <div style={{ marginTop: 22 }}>
          <OperatorEmptyState
            title="No locations yet"
            description="Add a location so PulseFill knows where cancellations become openings — then link providers and services."
            primaryAction={
              <Link href="#add-location" style={actionLinkStyle("primary")}>
                Add location
              </Link>
            }
            secondaryContent={
              <p className="pf-muted-copy" style={{ margin: 0, fontSize: 13 }}>
                <Link href="/overview#getting-started" style={{ color: "var(--pf-accent-primary)", fontWeight: 600 }}>
                  Back to getting started
                </Link>
              </p>
            }
          />
        </div>
      ) : null}

      {!loading && locations.length > 0 ? (
        <div
          style={{
            marginTop: 22,
            borderRadius: 12,
            overflowX: "auto",
            ...operatorSurfaceShell("quiet"),
            padding: 0,
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "rgba(255,255,255,0.04)" }}>
                <th style={thStyle}>Location</th>
                <th style={thStyle}>City</th>
              </tr>
            </thead>
            <tbody>
              {locations.map((loc) => (
                <tr key={loc.id}>
                  <td style={tdStyle}>{loc.name}</td>
                  <td style={tdStyle}>{loc.city ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </main>
  );
}

function submitStyle(disabled: boolean): CSSProperties {
  return {
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.18)",
    background: "rgba(255,255,255,0.1)",
    color: "var(--text)",
    padding: "10px 14px",
    fontSize: 14,
    cursor: disabled ? "wait" : "pointer",
    alignSelf: "flex-start",
  };
}

const thStyle: CSSProperties = {
  textAlign: "left",
  padding: "10px 14px",
  borderBottom: "1px solid rgba(255,255,255,0.1)",
  color: "rgba(245,247,250,0.42)",
  fontWeight: 600,
  fontSize: 11,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
};

const tdStyle: CSSProperties = {
  padding: "11px 14px",
  borderBottom: "1px solid rgba(255,255,255,0.06)",
};
