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

const inputStyle: CSSProperties = {
  borderRadius: 10,
  border: "1px solid rgba(255,255,255,0.14)",
  background: "var(--pf-auth-input-bg)",
  color: "var(--text)",
  padding: "10px 12px",
  fontSize: 14,
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
};

type ServiceRow = {
  id: string;
  name: string;
  duration_minutes: number;
};

export default function ServicesPage() {
  const { items, loading, error, reload } = useStaffArrayResource("/v1/services");
  const [name, setName] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const services = (Array.isArray(items) ? items : []) as ServiceRow[];

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!name.trim()) {
      setFormError("Name is required.");
      return;
    }

    let duration: number | undefined;
    if (durationMinutes.trim()) {
      const n = Number.parseInt(durationMinutes, 10);
      if (Number.isNaN(n) || n < 5 || n > 24 * 60) {
        setFormError("Duration must be a whole number between 5 and 1440 minutes (optional).");
        return;
      }
      duration = n;
    }

    setSaving(true);
    try {
      const body: { name: string; duration_minutes?: number } = { name: name.trim() };
      if (duration !== undefined) {
        body.duration_minutes = duration;
      }
      await apiFetch<ServiceRow>("/v1/services", {
        method: "POST",
        body: JSON.stringify(body),
      });
      setName("");
      setDurationMinutes("");
      await reload();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to create service");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="pf-page-services" style={{ padding: 0 }}>
      <PageCommandHeader
        animate={false}
        tone="default"
        eyebrow="Workspace"
        title="Services"
        description="Define what customers can join standby for. Accurate services improve opening duration and match quality."
        primaryAction={
          <Link href="#add-service" style={actionLinkStyle("primary")}>
            Add service
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
          id="add-service"
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
            New service
          </h2>
          <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13 }}>
            <span className="pf-op-field-label">Name *</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Dental cleaning"
              required
              style={inputStyle}
            />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13 }}>
            <span className="pf-op-field-label">Duration (minutes, optional)</span>
            <input
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(e.target.value)}
              placeholder="60"
              inputMode="numeric"
              style={inputStyle}
            />
            <span className="pf-meta-row" style={{ marginTop: 2 }}>
              Used to estimate the opening end time.
            </span>
          </label>
          {formError ? <p style={{ color: "#f87171", margin: 0, fontSize: 13 }}>{formError}</p> : null}
          <button type="submit" disabled={saving} style={submitStyle(saving)}>
            {saving ? "Saving…" : "Save service"}
          </button>
        </form>

        <div style={{ padding: 18, ...operatorSurfaceShell("quiet") }}>
          <h2 className="pf-section-title" style={{ fontSize: 15 }}>
            Why services matter
          </h2>
          <p className="pf-muted-copy" style={{ margin: "8px 0 0" }}>
            Services keep opening duration, matching rules, and customer expectations aligned — weak service data means weaker recovery matches.
          </p>
        </div>
      </div>

      {loading ? (
        <p className="pf-muted-copy" style={{ marginTop: 22 }}>
          Loading…
        </p>
      ) : null}
      {error ? <p style={{ color: "#f87171", marginTop: 16 }}>{error}</p> : null}

      {!loading && services.length === 0 ? (
        <div style={{ marginTop: 22 }}>
          <OperatorEmptyState
            title="No services yet"
            description="Add a service so PulseFill can match openings to the right type of care and send precise offers to standby customers."
            primaryAction={
              <Link href="#add-service" style={actionLinkStyle("primary")}>
                Add service
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

      {!loading && services.length > 0 ? (
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
                <th style={thStyle}>Service</th>
                <th style={thStyle}>Duration</th>
              </tr>
            </thead>
            <tbody>
              {services.map((s) => (
                <tr key={s.id}>
                  <td style={tdStyle}>{s.name}</td>
                  <td style={tdStyle}>{typeof s.duration_minutes === "number" ? `${s.duration_minutes} min` : "—"}</td>
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
