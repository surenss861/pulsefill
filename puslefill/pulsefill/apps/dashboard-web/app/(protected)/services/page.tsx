"use client";

import { useState } from "react";
import type { CSSProperties } from "react";
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
    <main style={{ padding: 0, maxWidth: 980 }}>
      <h1 style={{ marginTop: 0 }}>Services</h1>
      <p style={{ color: "var(--muted)", maxWidth: 640 }}>
        Define appointment types so opening times and standby matches stay accurate.
      </p>

      <div style={{ marginTop: 24, display: "grid", gap: 14, gridTemplateColumns: "1fr 1fr" }}>
        <form onSubmit={onSubmit} style={formBox}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 650 }}>Add service</h2>
          <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13 }}>
            <span style={{ color: "var(--muted)" }}>Name *</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Dental cleaning"
              required
              style={inputStyle}
            />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13 }}>
            <span style={{ color: "var(--muted)" }}>Duration (minutes, optional)</span>
            <input
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(e.target.value)}
              placeholder="60"
              inputMode="numeric"
              style={inputStyle}
            />
            <span style={{ fontSize: 12, color: "var(--muted)" }}>Used to estimate the opening end time.</span>
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
            {saving ? "Saving…" : "Save service"}
          </button>
        </form>

        <div style={formBox}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 650 }}>Setup guidance</h2>
          <p style={{ margin: "8px 0 0", fontSize: 13, color: "var(--muted)", lineHeight: 1.6 }}>
            Services help keep opening duration, matching rules, and customer expectations aligned.
          </p>
        </div>
      </div>

      {loading ? <p style={{ color: "var(--muted)", marginTop: 24 }}>Loading…</p> : null}
      {error ? <p style={{ color: "#f87171", marginTop: 16 }}>{error}</p> : null}

      {!loading && services.length === 0 ? (
        <div style={{ marginTop: 24 }}>
          <ActionEmptyState
            title="No services yet"
            description="Add a service above to match openings to the right type of care."
            ctaLabel="Back to getting started"
            ctaHref="/overview#getting-started"
          />
        </div>
      ) : null}

      {!loading && services.length > 0 ? (
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
