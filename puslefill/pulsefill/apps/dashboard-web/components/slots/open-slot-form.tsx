"use client";

import Link from "next/link";
import type { CSSProperties, FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import type { OpenSlotCreatedSummary } from "@/components/slots/open-slot-created-summary";
import { type CreateOpenSlotPayload, useCreateOpenSlot } from "@/hooks/useCreateOpenSlot";
import { useSlotFormOptions } from "@/hooks/useSlotFormOptions";
import { pressableHandlers, pressablePrimary } from "@/lib/pressable";

export type { OpenSlotCreatedSummary };

function toDatetimeLocalValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function defaultRange(): { start: string; end: string } {
  const start = new Date();
  start.setMinutes(0, 0, 0);
  start.setHours(start.getHours() + 1);
  const end = new Date(start);
  end.setMinutes(end.getMinutes() + 30);
  return { start: toDatetimeLocalValue(start), end: toDatetimeLocalValue(end) };
}

function localInputToIso(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) throw new Error("Invalid date");
  return d.toISOString();
}

function minutesBetween(startLocal: string, endLocal: string): number | null {
  const a = new Date(startLocal).getTime();
  const b = new Date(endLocal).getTime();
  if (Number.isNaN(a) || Number.isNaN(b) || b <= a) return null;
  return Math.round((b - a) / 60000);
}

const inputStyle: CSSProperties = {
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(0,0,0,0.2)",
  color: "var(--text)",
  padding: "10px 12px",
  fontSize: 14,
  width: "100%",
  boxSizing: "border-box",
};

type Props = {
  onCreated: (summary: OpenSlotCreatedSummary) => void;
};

export function OpenSlotForm({ onCreated }: Props) {
  const defaults = useMemo(() => defaultRange(), []);
  const { locations, providers, services, loading: optionsLoading, error: optionsError } = useSlotFormOptions();
  const { create, loading: submitting, error: createError, setError } = useCreateOpenSlot();

  const [locationId, setLocationId] = useState("");
  const [providerId, setProviderId] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [providerNameSnapshot, setProviderNameSnapshot] = useState("");
  const [startsLocal, setStartsLocal] = useState(defaults.start);
  const [endsLocal, setEndsLocal] = useState(defaults.end);
  const [estimatedDollars, setEstimatedDollars] = useState("");
  const [notes, setNotes] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);

  const setupIncomplete =
    locations.length === 0 || providers.length === 0 || services.length === 0;

  const durationHint = useMemo(() => {
    try {
      const a = new Date(startsLocal).getTime();
      const b = new Date(endsLocal).getTime();
      if (Number.isNaN(a) || Number.isNaN(b) || b <= a) return null;
      const min = (b - a) / 60000;
      if (min < 10 && min >= 1) return "short" as const;
      if (min > 480) return "long" as const;
      return null;
    } catch {
      return null;
    }
  }, [startsLocal, endsLocal]);
  const durationMinutes = useMemo(() => minutesBetween(startsLocal, endsLocal), [startsLocal, endsLocal]);
  const providerLabel = providerId ? providers.find((p) => p.id === providerId)?.name ?? "Not selected" : "Not selected";
  const serviceLabel = serviceId ? services.find((s) => s.id === serviceId)?.name ?? "Not selected" : "Not selected";
  const locationLabel = locationId ? locations.find((l) => l.id === locationId)?.name ?? "Not selected" : "Not selected";

  useEffect(() => {
    if (!serviceId) return;
    const s = services.find((x) => x.id === serviceId);
    if (!s) return;
    if (!startsLocal?.trim()) return;
    const start = new Date(startsLocal);
    if (Number.isNaN(start.getTime())) return;
    const end = new Date(start.getTime() + s.duration_minutes * 60_000);
    setEndsLocal(toDatetimeLocalValue(end));
  }, [serviceId, startsLocal, services]);

  function onProviderChange(id: string) {
    setProviderId(id);
    const p = providers.find((x) => x.id === id);
    setProviderNameSnapshot(p?.name ?? "");
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFieldError(null);
    setError(null);

    if (!startsLocal.trim() || !endsLocal.trim()) {
      setFieldError("Enter a start and end time.");
      return;
    }

    if (locations.length > 0 && !locationId) {
      setFieldError("Select a location for this opening.");
      return;
    }
    if (providers.length > 0 && !providerId) {
      setFieldError("Select which provider this opening is for.");
      return;
    }
    if (services.length > 0 && !serviceId) {
      setFieldError("Select a service for this opening.");
      return;
    }

    let startsIso: string;
    let endsIso: string;
    try {
      startsIso = localInputToIso(startsLocal);
      endsIso = localInputToIso(endsLocal);
    } catch {
      setFieldError("Enter valid start and end times.");
      return;
    }

    if (new Date(endsIso) <= new Date(startsIso)) {
      setFieldError("End time must be after start time.");
      return;
    }

    const durationMs = new Date(endsIso).getTime() - new Date(startsIso).getTime();
    if (durationMs < 60 * 1000) {
      setFieldError("Opening must be at least one minute long.");
      return;
    }

    const dollars = estimatedDollars.trim();
    let estimated_value_cents: number | null = null;
    if (dollars !== "") {
      const n = Number.parseFloat(dollars);
      if (Number.isNaN(n) || n < 0) {
        setFieldError("Estimated value must be a non-negative number.");
        return;
      }
      estimated_value_cents = Math.round(n * 100);
    }

    const payload: CreateOpenSlotPayload = {
      starts_at: startsIso,
      ends_at: endsIso,
    };

    if (locationId) payload.location_id = locationId;
    if (providerId) payload.provider_id = providerId;
    if (serviceId) payload.service_id = serviceId;
    const snap = providerNameSnapshot.trim();
    if (snap) payload.provider_name_snapshot = snap;
    if (estimated_value_cents !== null) payload.estimated_value_cents = estimated_value_cents;
    const n = notes.trim();
    if (n) payload.notes = n;

    try {
      const slot = await create(payload);

      const providerLabel =
        slot.provider_name_snapshot?.trim() ||
        snap ||
        (providerId ? providers.find((p) => p.id === providerId)?.name : null) ||
        "—";

      const serviceLabel = serviceId ? services.find((s) => s.id === serviceId)?.name ?? null : null;
      const locationLabel = locationId ? locations.find((x) => x.id === locationId)?.name ?? null : null;

      onCreated({
        slotId: slot.id,
        providerLabel,
        startsAt: slot.starts_at ?? startsIso,
        endsAt: slot.ends_at ?? endsIso,
        serviceLabel,
        locationLabel,
        estimatedValueCents:
          slot.estimated_value_cents !== undefined && slot.estimated_value_cents !== null
            ? slot.estimated_value_cents
            : estimated_value_cents,
      });
    } catch {
      // error surfaced via createError
    }
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} style={{ display: "grid", gap: 20, marginTop: 8 }}>
      {optionsLoading ? <p style={{ color: "var(--muted)", margin: 0 }}>Loading locations, providers, services…</p> : null}
      {optionsError ? <p style={{ color: "#f87171", margin: 0 }}>{optionsError}</p> : null}

      {setupIncomplete && !optionsLoading ? (
        <div
          style={{
            borderRadius: 16,
            border: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(255,255,255,0.03)",
            padding: 14,
            fontSize: 13,
            lineHeight: 1.5,
            color: "var(--text)",
          }}
        >
          <strong style={{ display: "block", marginBottom: 6 }}>Finish setup before creating openings</strong>
          <span style={{ color: "var(--muted)" }}>
            Add at least one location, provider, and service to post openings.
          </span>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
            <Link href="/locations" style={{ color: "var(--primary)", fontWeight: 600 }}>
              Add location
            </Link>
            <span style={{ color: "var(--muted)" }}>·</span>
            <Link href="/providers" style={{ color: "var(--primary)", fontWeight: 600 }}>
              Add provider
            </Link>
            <span style={{ color: "var(--muted)" }}>·</span>
            <Link href="/services" style={{ color: "var(--primary)", fontWeight: 600 }}>
              Add service
            </Link>
          </div>
        </div>
      ) : null}

      <div style={{ display: "grid", gap: 16, gridTemplateColumns: "2fr 1fr", alignItems: "start" }}>
        <div style={{ display: "grid", gap: 16 }}>
          <section style={sectionStyle}>
            <h2 style={sectionTitle}>1. Appointment details</h2>
            <div style={{ display: "grid", gap: 14 }}>
              <label style={{ display: "grid", gap: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>
                  Location{locations.length > 0 ? " *" : ""}
                </span>
                <select
                  value={locationId}
                  onChange={(e) => setLocationId(e.target.value)}
                  style={inputStyle}
                  disabled={optionsLoading}
                  required={locations.length > 0}
                >
                  <option value="">{locations.length > 0 ? "Select…" : "Not set"}</option>
                  {locations.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </label>

              <label style={{ display: "grid", gap: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>
                  Provider{providers.length > 0 ? " *" : ""}
                </span>
                <select
                  value={providerId}
                  onChange={(e) => onProviderChange(e.target.value)}
                  style={inputStyle}
                  disabled={optionsLoading}
                  required={providers.length > 0}
                >
                  <option value="">{providers.length > 0 ? "Select…" : "None loaded"}</option>
                  {providers.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </label>

              <label style={{ display: "grid", gap: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>
                  Service{services.length > 0 ? " *" : ""}
                </span>
                <select
                  value={serviceId}
                  onChange={(e) => setServiceId(e.target.value)}
                  style={inputStyle}
                  disabled={optionsLoading}
                  required={services.length > 0}
                >
                  <option value="">{services.length > 0 ? "Select…" : "Not set"}</option>
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.duration_minutes} min)
                    </option>
                  ))}
                </select>
              </label>

              <details>
                <summary style={{ cursor: "pointer", color: "var(--muted)", fontSize: 13 }}>Advanced</summary>
                <label style={{ display: "grid", gap: 6, marginTop: 10 }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>Offer label (optional)</span>
                  <input
                    type="text"
                    value={providerNameSnapshot}
                    onChange={(e) => setProviderNameSnapshot(e.target.value)}
                    placeholder="Customer-facing name for this opening"
                    style={inputStyle}
                  />
                </label>
              </details>
            </div>
          </section>

          <section style={sectionStyle}>
            <h2 style={sectionTitle}>2. Time window</h2>
            <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
              <label style={{ display: "grid", gap: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>Starts *</span>
                <input
                  type="datetime-local"
                  value={startsLocal}
                  onChange={(e) => setStartsLocal(e.target.value)}
                  required
                  style={{ ...inputStyle, fontSize: 15, padding: "12px 12px" }}
                />
              </label>
              <label style={{ display: "grid", gap: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>Ends *</span>
                <input
                  type="datetime-local"
                  value={endsLocal}
                  onChange={(e) => setEndsLocal(e.target.value)}
                  required
                  style={{ ...inputStyle, fontSize: 15, padding: "12px 12px" }}
                />
              </label>
            </div>
            <p style={{ margin: "10px 0 0", fontSize: 13, color: "var(--muted)" }}>
              {durationMinutes ? `${durationMinutes} minute opening` : "Set both start and end time to preview duration."}
            </p>
            {durationHint === "short" ? (
              <p style={{ margin: "6px 0 0", fontSize: 12, color: "rgba(251,191,36,0.9)" }}>
                Short window - double-check before sending offers.
              </p>
            ) : null}
            {durationHint === "long" ? (
              <p style={{ margin: "6px 0 0", fontSize: 12, color: "rgba(251,191,36,0.9)" }}>
                Long window - confirm that this is intentional.
              </p>
            ) : null}
          </section>

          <section style={sectionStyle}>
            <h2 style={sectionTitle}>3. Offer details</h2>
            <div style={{ display: "grid", gap: 14 }}>
              <label style={{ display: "grid", gap: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>Estimated value (optional)</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={estimatedDollars}
                  onChange={(e) => setEstimatedDollars(e.target.value)}
                  placeholder="0.00"
                  style={inputStyle}
                />
              </label>

              <label style={{ display: "grid", gap: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>Internal note (optional)</span>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  style={{ ...inputStyle, resize: "vertical", minHeight: 72 }}
                />
              </label>
            </div>
          </section>
        </div>

        <aside
          style={{
            borderRadius: 16,
            border: "1px solid rgba(255,255,255,0.1)",
            background: "rgba(255,255,255,0.03)",
            padding: 14,
            position: "sticky",
            top: 16,
          }}
        >
          <p style={{ margin: 0, fontSize: 12, color: "var(--muted)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
            Opening summary
          </p>
          <div style={{ marginTop: 10, display: "grid", gap: 8, fontSize: 13 }}>
            <p style={{ margin: 0 }}><span style={{ color: "var(--muted)" }}>Location · </span>{locationLabel}</p>
            <p style={{ margin: 0 }}><span style={{ color: "var(--muted)" }}>Provider · </span>{providerLabel}</p>
            <p style={{ margin: 0 }}><span style={{ color: "var(--muted)" }}>Service · </span>{serviceLabel}</p>
            <p style={{ margin: 0 }}><span style={{ color: "var(--muted)" }}>Duration · </span>{durationMinutes ? `${durationMinutes} min` : "—"}</p>
          </div>
        </aside>
      </div>

      {fieldError ? <p style={{ margin: 0, fontSize: 13, color: "#f87171" }}>{fieldError}</p> : null}
      {createError ? <p style={{ margin: 0, fontSize: 13, color: "#f87171" }}>{createError}</p> : null}

      <div
        style={{
          position: "sticky",
          bottom: 0,
          zIndex: 20,
          borderRadius: 14,
          border: "1px solid rgba(255,255,255,0.12)",
          background: "rgba(5,6,8,0.92)",
          padding: 12,
          display: "flex",
          gap: 10,
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
        }}
      >
        <Link href="/open-slots" style={{ color: "var(--muted)", fontSize: 13 }}>
          Back to openings
        </Link>
        <button
          type="submit"
          disabled={submitting || optionsLoading}
          style={{
            ...pressablePrimary,
            opacity: submitting || optionsLoading ? 0.65 : 1,
            cursor: submitting || optionsLoading ? "not-allowed" : "pointer",
          }}
          {...pressableHandlers(submitting || optionsLoading)}
        >
          {submitting ? "Creating…" : "Create opening"}
        </button>
      </div>
    </form>
  );
}

const sectionStyle: CSSProperties = {
  borderRadius: 16,
  border: "1px solid rgba(255,255,255,0.1)",
  background: "rgba(255,255,255,0.03)",
  padding: 16,
};

const sectionTitle: CSSProperties = {
  margin: "0 0 12px",
  fontSize: 15,
  fontWeight: 650,
};
