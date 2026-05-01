"use client";

import Link from "next/link";
import { useState, type CSSProperties } from "react";
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
        eyebrow="Workspace setup"
        title="Services"
        description="Define what customers can join standby for. Accurate services improve opening duration and match quality."
        primaryAction={
          <MotionAction>
            <Link href="#add-service" style={actionLinkStyle("primary")}>
              Add service
            </Link>
          </MotionAction>
        }
        style={{ marginBottom: 16 }}
      />

      <OperatorPageTransition>
      <OperatorFormShell
        title="New service"
        description="Name the appointment type customers can receive offers for."
        rail={
          <>
            <h3 className="pf-section-title" style={{ fontSize: 14, margin: 0 }}>
              Matching depends on this
            </h3>
            <p className="pf-muted-copy" style={{ margin: "10px 0 0", fontSize: 13 }}>
              Services keep duration, matching rules, and customer expectations aligned — weak service data means weaker recovery matches.
            </p>
          </>
        }
        footer={
          <>
            {formError ? <p style={{ color: "#f87171", margin: 0, fontSize: 13 }}>{formError}</p> : null}
            <MotionTapSurface disabled={saving}>
              <button type="submit" form="add-service" disabled={saving} style={primarySubmit(saving)}>
                {saving ? "Saving…" : "Save service"}
              </button>
            </MotionTapSurface>
          </>
        }
      >
        <form id="add-service" onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
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

      {!loading && !error && services.length === 0 ? (
        <div style={{ marginTop: 22 }}>
          <OperatorListEmptyState
            title="Add your first service"
            description="Services help PulseFill match openings to the right standby customers."
            primaryAction={
              <MotionAction>
                <Link href="#add-service" style={actionLinkStyle("primary")}>
                  Add service
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

      {!loading && !error && services.length > 0 ? (
        <div style={{ marginTop: 22 }}>
          <OperatorRowList>
            {services.map((s) => (
              <OperatorRow
                key={s.id}
                title={s.name}
                meta={typeof s.duration_minutes === "number" ? `${s.duration_minutes} min` : "Duration not set"}
                status={<OperatorStatusChip kind="live" label="Listed" />}
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
