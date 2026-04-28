"use client";

import { useState } from "react";
import type { CSSProperties } from "react";
import { ActionEmptyState } from "@/components/ui/action-empty-state";
import { useStaffArrayResource } from "@/hooks/useStaffArrayResource";
import { apiFetch } from "@/lib/api";

type LocationRow = { id: string; name: string; city: string | null };

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
    <main style={{ padding: 0, maxWidth: 980 }}>
      <h1 style={{ marginTop: 0 }}>Locations</h1>
      <p style={{ color: "var(--muted)", maxWidth: 640 }}>
        Add the places where appointment openings happen.
      </p>

      <div
        style={{
          marginTop: 24,
          display: "grid",
          gap: 14,
          gridTemplateColumns: "1fr 1fr",
        }}
      >
        <form
          onSubmit={onSubmit}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
            padding: 16,
            borderRadius: 16,
            border: "1px solid rgba(255,255,255,0.1)",
            background: "rgba(255,255,255,0.04)",
          }}
        >
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 650 }}>Add location</h2>
          <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13 }}>
            <span style={{ color: "var(--muted)" }}>Name *</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Yorkville Clinic"
              required
              style={inputStyle}
            />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13 }}>
            <span style={{ color: "var(--muted)" }}>City (optional)</span>
            <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Toronto" style={inputStyle} />
          </label>
          {formError ? <p style={{ color: "#f87171", margin: 0, fontSize: 13 }}>{formError}</p> : null}
          <button type="submit" disabled={saving} style={submitStyle(saving)}>
            {saving ? "Saving…" : "Save location"}
          </button>
        </form>

        <div style={infoCardStyle}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 650 }}>Why locations matter</h2>
          <p style={{ margin: "8px 0 0", fontSize: 13, color: "var(--muted)", lineHeight: 1.6 }}>
            Locations help route openings to the right clinic and improve standby matching.
          </p>
        </div>
      </div>

      {loading ? <p style={{ color: "var(--muted)", marginTop: 24 }}>Loading…</p> : null}
      {error ? <p style={{ color: "#f87171", marginTop: 16 }}>{error}</p> : null}

      {!loading && locations.length === 0 ? (
        <div style={{ marginTop: 24 }}>
          <ActionEmptyState
            title="No locations yet"
            description="Add at least one location above so PulseFill knows where openings belong."
            ctaLabel="Back to getting started"
            ctaHref="/overview#getting-started"
          />
        </div>
      ) : null}

      {!loading && locations.length > 0 ? (
        <div
          style={{
            marginTop: 24,
            borderRadius: 12,
            overflow: "hidden",
            border: "1px solid rgba(255,255,255,0.1)",
            background: "rgba(0,0,0,0.2)",
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

const inputStyle: CSSProperties = {
  borderRadius: 10,
  border: "1px solid rgba(255,255,255,0.14)",
  background: "rgba(0,0,0,0.2)",
  color: "var(--text)",
  padding: "10px 12px",
  fontSize: 14,
};

const infoCardStyle: CSSProperties = {
  padding: 16,
  borderRadius: 16,
  border: "1px solid rgba(255,255,255,0.1)",
  background: "rgba(255,255,255,0.03)",
};

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
  padding: "10px 12px",
  borderBottom: "1px solid rgba(255,255,255,0.1)",
  color: "var(--muted)",
  fontWeight: 600,
};

const tdStyle: CSSProperties = {
  padding: "10px 12px",
  borderBottom: "1px solid rgba(255,255,255,0.06)",
};
