"use client";

import { useMemo, useState } from "react";
import type { CSSProperties } from "react";
import Link from "next/link";
import { ActionEmptyState } from "@/components/ui/action-empty-state";
import { useStaffArrayResource } from "@/hooks/useStaffArrayResource";
import { apiFetch } from "@/lib/api";

const inputStyle: CSSProperties = {
  borderRadius: 10,
  border: "1px solid rgba(255,255,255,0.14)",
  background: "rgba(0,0,0,0.2)",
  color: "var(--text)",
  padding: "10px 12px",
  fontSize: 14,
};

const formBox: CSSProperties = {
  marginTop: 24,
  maxWidth: 420,
  display: "flex",
  flexDirection: "column",
  gap: 12,
  padding: 20,
  borderRadius: 16,
  border: "1px solid rgba(255,255,255,0.1)",
  background: "rgba(255,255,255,0.04)",
};

type LocationRow = { id: string; name: string };
type ProviderRow = { id: string; name: string; location_id: string | null };

export default function ProvidersPage() {
  const { items, loading, error, reload } = useStaffArrayResource("/v1/providers");
  const {
    items: locItems,
    loading: locLoading,
    error: locError,
  } = useStaffArrayResource("/v1/locations");

  const [name, setName] = useState("");
  const [locationId, setLocationId] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const providers = (Array.isArray(items) ? items : []) as ProviderRow[];
  const locations = (Array.isArray(locItems) ? locItems : []) as LocationRow[];
  const locationNameById = useMemo(() => {
    const m = new Map<string, string>();
    for (const loc of locations) m.set(loc.id, loc.name);
    return m;
  }, [locations]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!name.trim()) {
      setFormError("Name is required.");
      return;
    }
    setSaving(true);
    try {
      const body: { name: string; location_id?: string } = { name: name.trim() };
      if (locationId) {
        body.location_id = locationId;
      }
      await apiFetch<ProviderRow>("/v1/providers", {
        method: "POST",
        body: JSON.stringify(body),
      });
      setName("");
      setLocationId("");
      await reload();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to create provider");
    } finally {
      setSaving(false);
    }
  }

  const listLoading = loading || locLoading;
  const listError = error || locError;

  return (
    <main style={{ padding: 0, maxWidth: 980 }}>
      <h1 style={{ marginTop: 0 }}>Providers</h1>
      <p style={{ color: "var(--muted)", maxWidth: 640 }}>
        Add the people or calendars that openings belong to.
      </p>

      <div style={{ marginTop: 24, display: "grid", gap: 14, gridTemplateColumns: "1fr 1fr" }}>
        <form onSubmit={onSubmit} style={formBox}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 650 }}>Add provider</h2>
          <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13 }}>
            <span style={{ color: "var(--muted)" }}>Name *</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Dr. Lee"
              required
              style={inputStyle}
            />
          </label>
          {locations.length > 0 ? (
            <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13 }}>
              <span style={{ color: "var(--muted)" }}>Location (optional)</span>
              <select
                value={locationId}
                onChange={(e) => setLocationId(e.target.value)}
                style={{ ...inputStyle, cursor: "pointer" }}
              >
                <option value="">— None —</option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <p style={{ margin: 0, fontSize: 12, color: "var(--muted)" }}>
              Add a location first so providers can be linked to a clinic site.
            </p>
          )}
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
            {saving ? "Saving…" : "Save provider"}
          </button>
        </form>

        <div style={formBox}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 650 }}>Setup guidance</h2>
          {locations.length === 0 ? (
            <p style={{ margin: "8px 0 0", fontSize: 13, color: "var(--muted)", lineHeight: 1.6 }}>
              Finish location setup first, then add providers so openings can be assigned correctly.
              <br />
              <Link href="/locations" style={{ color: "var(--primary)", fontWeight: 600 }}>
                Add location
              </Link>
            </p>
          ) : (
            <p style={{ margin: "8px 0 0", fontSize: 13, color: "var(--muted)", lineHeight: 1.6 }}>
              Providers can optionally be linked to a default location for cleaner routing.
            </p>
          )}
        </div>
      </div>

      {listLoading ? <p style={{ color: "var(--muted)", marginTop: 24 }}>Loading…</p> : null}
      {listError ? <p style={{ color: "#f87171", marginTop: 16 }}>{listError}</p> : null}

      {!listLoading && providers.length === 0 ? (
        <div style={{ marginTop: 24 }}>
          <ActionEmptyState
            title="No providers yet"
            description="Add a provider above so staff can attach openings to the right person."
            ctaLabel="Back to getting started"
            ctaHref="/overview#getting-started"
          />
        </div>
      ) : null}

      {!listLoading && providers.length > 0 ? (
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
                <th style={thStyle}>Provider</th>
                <th style={thStyle}>Default location</th>
              </tr>
            </thead>
            <tbody>
              {providers.map((p) => (
                <tr key={p.id}>
                  <td style={tdStyle}>{p.name}</td>
                  <td style={tdStyle}>{p.location_id ? locationNameById.get(p.location_id) ?? "Unlinked" : "Unlinked"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </main>
  );
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
