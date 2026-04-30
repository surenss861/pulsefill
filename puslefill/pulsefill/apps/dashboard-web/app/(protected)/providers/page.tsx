"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { PageCommandHeader } from "@/components/operator/page-command-header";
import { OperatorEmptyState } from "@/components/operator/operator-empty-state";
import { actionLinkStyle } from "@/lib/operator-action-link-styles";
import { useStaffArrayResource } from "@/hooks/useStaffArrayResource";
import { apiFetch } from "@/lib/api";
import { operatorSurfaceShell } from "@/lib/operator-surface-styles";

const inputStyle: CSSProperties = {
  borderRadius: 10,
  border: "1px solid rgba(255,255,255,0.14)",
  background: "var(--pf-auth-input-bg)",
  color: "var(--text)",
  padding: "10px 12px",
  fontSize: 14,
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
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
    <main className="pf-page-providers" style={{ padding: 0 }}>
      <PageCommandHeader
        animate={false}
        tone="default"
        eyebrow="Workspace"
        title="Providers"
        description="Manage staff calendars tied to openings. Providers label recovery work and optional default locations."
        primaryAction={
          <Link href="#add-provider" style={actionLinkStyle("primary")}>
            Add provider
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
          id="add-provider"
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
            New provider
          </h2>
          <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13 }}>
            <span className="pf-op-field-label">Name *</span>
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
              <span className="pf-op-field-label">Location (optional)</span>
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
            <p className="pf-muted-copy" style={{ margin: 0, fontSize: 12 }}>
              Add a{" "}
              <Link href="/locations" style={{ color: "var(--pf-accent-primary)", fontWeight: 600 }}>
                location
              </Link>{" "}
              first so providers can be linked to a clinic site.
            </p>
          )}
          {formError ? <p style={{ color: "#f87171", margin: 0, fontSize: 13 }}>{formError}</p> : null}
          <button type="submit" disabled={saving} style={submitStyle(saving)}>
            {saving ? "Saving…" : "Save provider"}
          </button>
        </form>

        <div style={{ padding: 18, ...operatorSurfaceShell("quiet") }}>
          <h2 className="pf-section-title" style={{ fontSize: 15 }}>
            Setup guidance
          </h2>
          {locations.length === 0 ? (
            <p className="pf-muted-copy" style={{ margin: "8px 0 0" }}>
              Finish location setup first, then add providers so openings can be assigned correctly.
            </p>
          ) : (
            <p className="pf-muted-copy" style={{ margin: "8px 0 0" }}>
              Providers can optionally be linked to a default location for cleaner routing.
            </p>
          )}
        </div>
      </div>

      {listLoading ? (
        <p className="pf-muted-copy" style={{ marginTop: 22 }}>
          Loading…
        </p>
      ) : null}
      {listError ? <p style={{ color: "#f87171", marginTop: 16 }}>{listError}</p> : null}

      {!listLoading && providers.length === 0 ? (
        <div style={{ marginTop: 22 }}>
          <OperatorEmptyState
            title="No providers yet"
            description="Add a provider so staff can attach openings to the right person or calendar."
            primaryAction={
              <Link href="#add-provider" style={actionLinkStyle("primary")}>
                Add provider
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

      {!listLoading && providers.length > 0 ? (
        <div
          style={{
            marginTop: 22,
            borderRadius: 12,
            overflow: "hidden",
            ...operatorSurfaceShell("quiet"),
            padding: 0,
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
