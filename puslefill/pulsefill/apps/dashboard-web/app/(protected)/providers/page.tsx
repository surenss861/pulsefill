"use client";

import Link from "next/link";
import { useMemo, useState, type CSSProperties } from "react";
import { PageCommandHeader } from "@/components/operator/page-command-header";
import { MotionAction, MotionTapSurface } from "@/components/operator/operator-motion-primitives";
import { OperatorPageTransition } from "@/components/operator/operator-page-transition";
import { OperatorErrorState } from "@/components/operator/operator-error-state";
import { OperatorFormShell } from "@/components/operator/operator-form-shell";
import { OperatorListEmptyState } from "@/components/operator/operator-list-empty-state";
import { OperatorLoadingState } from "@/components/operator/operator-loading-state";
import { OperatorRow, OperatorRowList } from "@/components/operator/operator-row-list";
import { OperatorStatusChip } from "@/components/operator/operator-status-chip";
import { actionLinkStyle } from "@/lib/operator-action-link-styles";
import { useStaffArrayResource } from "@/hooks/useStaffArrayResource";
import { apiFetch } from "@/lib/api";

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
        eyebrow="Workspace setup"
        title="Providers"
        description="Add the people or calendars tied to recoverable openings. Providers label recovery work and optional default locations."
        primaryAction={
          <MotionAction>
            <Link href="#add-provider" style={actionLinkStyle("primary")}>
              Add provider
            </Link>
          </MotionAction>
        }
        style={{ marginBottom: 16 }}
      />

      <OperatorPageTransition>
      <OperatorFormShell
        title="New provider"
        description="Name the staff member or calendar that openings can belong to."
        rail={
          <>
            <h3 className="pf-section-title" style={{ fontSize: 14, margin: 0 }}>
              Setup guidance
            </h3>
            <p className="pf-muted-copy" style={{ margin: "10px 0 0", fontSize: 13 }}>
              {locations.length === 0
                ? "Finish location setup first, then add providers so openings can be assigned correctly."
                : "Link a default location when it helps route recovery work to the right site."}
            </p>
          </>
        }
        footer={
          <>
            {formError ? <p style={{ color: "#f87171", margin: 0, fontSize: 13 }}>{formError}</p> : null}
            <MotionTapSurface disabled={saving}>
              <button type="submit" form="add-provider" disabled={saving} style={primarySubmit(saving)}>
                {saving ? "Saving…" : "Save provider"}
              </button>
            </MotionTapSurface>
          </>
        }
      >
        <form id="add-provider" onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
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
              <MotionAction>
                <Link href="/locations" style={{ color: "var(--pf-accent-primary)", fontWeight: 600 }}>
                  location
                </Link>
              </MotionAction>{" "}
              first so providers can be linked to a clinic site.
            </p>
          )}
        </form>
      </OperatorFormShell>

      {listLoading ? (
        <div style={{ marginTop: 22 }}>
          <OperatorLoadingState variant="section" skeleton="rows" />
        </div>
      ) : null}
      {listError ? (
        <div style={{ marginTop: 16 }}>
          <OperatorErrorState rawMessage={listError} />
        </div>
      ) : null}

      {!listLoading && !listError && providers.length === 0 ? (
        <div style={{ marginTop: 22 }}>
          <OperatorListEmptyState
            title="Add your first provider"
            description="Providers help PulseFill route openings to the right schedule or staff member."
            primaryAction={
              <MotionAction>
                <Link href="#add-provider" style={actionLinkStyle("primary")}>
                  Add provider
                </Link>
              </MotionAction>
            }
            secondaryAction={
              <MotionAction>
                <Link href="/overview#getting-started" style={actionLinkStyle("secondary")}>
                  Back to getting started
                </Link>
              </MotionAction>
            }
          />
        </div>
      ) : null}

      {!listLoading && !listError && providers.length > 0 ? (
        <div style={{ marginTop: 22 }}>
          <OperatorRowList>
            {providers.map((p) => (
              <OperatorRow
                key={p.id}
                title={p.name}
                meta={p.location_id ? locationNameById.get(p.location_id) ?? "Linked location" : "No default location"}
                status={<OperatorStatusChip kind="live" label="Active" />}
              />
            ))}
          </OperatorRowList>
        </div>
      ) : null}
      </OperatorPageTransition>
    </main>
  );
}

function primarySubmit(disabled: boolean): CSSProperties {
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
