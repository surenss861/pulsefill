"use client";

import { useState } from "react";
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
    <main style={{ padding: 24 }}>
      <h1 style={{ marginTop: 0 }}>Locations</h1>
      <p style={{ color: "var(--muted)", maxWidth: 640 }}>
        Locations for your business from <code style={{ color: "var(--primary)" }}>GET /v1/locations</code>.
        Create a location with <code style={{ color: "var(--primary)" }}>POST /v1/locations</code>.
      </p>

      <form
        onSubmit={onSubmit}
        style={{
          marginTop: 24,
          maxWidth: 420,
          display: "flex",
          flexDirection: "column",
          gap: 12,
          padding: 20,
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
            style={{
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.14)",
              background: "rgba(0,0,0,0.2)",
              color: "var(--text)",
              padding: "10px 12px",
              fontSize: 14,
            }}
          />
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13 }}>
          <span style={{ color: "var(--muted)" }}>City (optional)</span>
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Toronto"
            style={{
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.14)",
              background: "rgba(0,0,0,0.2)",
              color: "var(--text)",
              padding: "10px 12px",
              fontSize: 14,
            }}
          />
        </label>
        {formError ? <p style={{ color: "#f87171", margin: 0, fontSize: 13 }}>{formError}</p> : null}
        <button
          type="submit"
          disabled={saving}
          style={{
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.18)",
            background: "rgba(255,255,255,0.1)",
            color: "var(--text)",
            padding: "10px 14px",
            fontSize: 14,
            cursor: saving ? "wait" : "pointer",
            alignSelf: "flex-start",
          }}
        >
          {saving ? "Saving…" : "Save location"}
        </button>
      </form>

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
        <ul style={{ marginTop: 24, paddingLeft: 20, color: "var(--muted)" }}>
          {locations.map((loc) => (
            <li key={loc.id} style={{ marginBottom: 8 }}>
              <strong style={{ color: "var(--text)" }}>{loc.name}</strong>
              {loc.city ? ` — ${loc.city}` : null}
            </li>
          ))}
        </ul>
      ) : null}
    </main>
  );
}
