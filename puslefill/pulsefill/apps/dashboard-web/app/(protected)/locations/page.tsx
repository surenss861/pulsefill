"use client";

import Link from "next/link";
import { useState, type CSSProperties } from "react";
import { PageCommandHeader } from "@/components/operator/page-command-header";
import { OperatorErrorState } from "@/components/operator/operator-error-state";
import { OperatorFormShell } from "@/components/operator/operator-form-shell";
import { OperatorListEmptyState } from "@/components/operator/operator-list-empty-state";
import { OperatorLoadingState } from "@/components/operator/operator-loading-state";
import { OperatorRow, OperatorRowList } from "@/components/operator/operator-row-list";
import { OperatorStatusChip } from "@/components/operator/operator-status-chip";
import { actionLinkStyle } from "@/lib/operator-action-link-styles";
import { useStaffArrayResource } from "@/hooks/useStaffArrayResource";
import { apiFetch } from "@/lib/api";

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
        eyebrow="Workspace setup"
        title="Locations"
        description="Add the places where openings can be recovered. Locations route staff and customers before offers go out."
        primaryAction={
          <Link href="#add-location" style={actionLinkStyle("primary")}>
            Add location
          </Link>
        }
        style={{ marginBottom: 16 }}
      />

      <OperatorFormShell
        title="New location"
        description="Name the site where cancellations become openings."
        rail={
          <>
            <h3 className="pf-section-title" style={{ fontSize: 14, margin: 0 }}>
              Why it matters
            </h3>
            <p className="pf-muted-copy" style={{ margin: "10px 0 0", fontSize: 13 }}>
              Openings need a location before they can be sent to standby customers. Add every site you recover from.
            </p>
          </>
        }
        footer={
          <>
            {formError ? <p style={{ color: "#f87171", margin: 0, fontSize: 13 }}>{formError}</p> : null}
            <button type="submit" form="add-location" disabled={saving} style={submitStyle(saving)}>
              {saving ? "Saving…" : "Save location"}
            </button>
          </>
        }
      >
        <form id="add-location" onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
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
        </form>
      </OperatorFormShell>

      {loading ? (
        <div style={{ marginTop: 22 }}>
          <OperatorLoadingState variant="section" skeleton="rows" />
        </div>
      ) : null}
      {error ? (
        <div style={{ marginTop: 16 }}>
          <OperatorErrorState rawMessage={error} />
        </div>
      ) : null}

      {!loading && !error && locations.length === 0 ? (
        <div style={{ marginTop: 22 }}>
          <OperatorListEmptyState
            title="Add your first location"
            description="Locations tell PulseFill where openings happen before customers receive offers."
            primaryAction={
              <Link href="#add-location" style={actionLinkStyle("primary")}>
                Add location
              </Link>
            }
            secondaryAction={
              <Link href="/overview#getting-started" style={actionLinkStyle("secondary")}>
                Back to getting started
              </Link>
            }
          />
        </div>
      ) : null}

      {!loading && !error && locations.length > 0 ? (
        <div style={{ marginTop: 22 }}>
          <OperatorRowList>
            {locations.map((loc) => (
              <OperatorRow
                key={loc.id}
                title={loc.name}
                meta={loc.city ? `${loc.city}` : "No city on file"}
                status={<OperatorStatusChip kind="live" label="Active" />}
              />
            ))}
          </OperatorRowList>
        </div>
      ) : null}
    </main>
  );
}

function submitStyle(disabled: boolean): CSSProperties {
  return {
    borderRadius: 10,
    border: "1px solid var(--pf-accent-primary-border)",
    background: "linear-gradient(180deg, #ff7a18 0%, #f97316 100%)",
    color: "var(--pf-btn-primary-text)",
    padding: "10px 16px",
    fontSize: 14,
    fontWeight: 700,
    cursor: disabled ? "wait" : "pointer",
    alignSelf: "flex-start",
    boxShadow: "0 10px 28px rgba(255, 122, 24, 0.28)",
  };
}
