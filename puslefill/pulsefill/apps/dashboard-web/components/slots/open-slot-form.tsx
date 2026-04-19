"use client";

import Link from "next/link";
import type { CSSProperties, FormEvent } from "react";
import { useMemo, useState } from "react";
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

    if (providers.length > 0 && !providerId) {
      setFieldError("Select which provider this opening is for.");
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
      setFieldError("Slot must be at least one minute long.");
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
            border: "1px solid rgba(251,191,36,0.35)",
            background: "rgba(251,191,36,0.08)",
            padding: 14,
            fontSize: 13,
            lineHeight: 1.5,
            color: "var(--text)",
          }}
        >
          <strong style={{ display: "block", marginBottom: 6 }}>Finish business setup first</strong>
          PulseFill works best with at least one location, provider, and service.{" "}
          <Link href="/overview#getting-started" style={{ color: "var(--primary)" }}>
            Open the setup checklist
          </Link>
          .
        </div>
      ) : null}

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
        <span style={{ fontSize: 12, color: "var(--muted)" }}>Who can take this opening.</span>
      </label>

      <label style={{ display: "grid", gap: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 600 }}>Display name (optional)</span>
        <input
          type="text"
          value={providerNameSnapshot}
          onChange={(e) => setProviderNameSnapshot(e.target.value)}
          placeholder="Shown on offers and staff views"
          style={inputStyle}
        />
        <span style={{ fontSize: 12, color: "var(--muted)" }}>
          Prefilled when you pick a provider; override if needed.
        </span>
      </label>

      <label style={{ display: "grid", gap: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 600 }}>Service</span>
        <select value={serviceId} onChange={(e) => setServiceId(e.target.value)} style={inputStyle} disabled={optionsLoading}>
          <option value="">Any / not set</option>
          {services.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <span style={{ fontSize: 12, color: "var(--muted)" }}>
          Helps match the right standby customers to this opening.
        </span>
        {!serviceId && services.length > 0 ? (
          <span style={{ fontSize: 12, color: "rgba(251,191,36,0.85)" }}>
            Without a specific service, standby matching may be broader.
          </span>
        ) : null}
      </label>

      <label style={{ display: "grid", gap: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 600 }}>Location</span>
        <select value={locationId} onChange={(e) => setLocationId(e.target.value)} style={inputStyle} disabled={optionsLoading}>
          <option value="">Not set</option>
          {locations.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>
        {!locationId && locations.length > 0 ? (
          <span style={{ fontSize: 12, color: "rgba(251,191,36,0.85)" }}>
            Without a location, location-specific context won’t be stored on this slot.
          </span>
        ) : null}
      </label>

      <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>Starts *</span>
          <input
            type="datetime-local"
            value={startsLocal}
            onChange={(e) => setStartsLocal(e.target.value)}
            required
            style={inputStyle}
          />
        </label>
        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>Ends *</span>
          <input
            type="datetime-local"
            value={endsLocal}
            onChange={(e) => setEndsLocal(e.target.value)}
            required
            style={inputStyle}
          />
        </label>
      </div>
      <p style={{ margin: 0, fontSize: 12, color: "var(--muted)" }}>The actual appointment window that just opened up.</p>
      {durationHint === "short" ? (
        <p style={{ margin: 0, fontSize: 12, color: "rgba(251,191,36,0.9)" }}>
          Short window—double-check the times before sending offers.
        </p>
      ) : null}
      {durationHint === "long" ? (
        <p style={{ margin: 0, fontSize: 12, color: "rgba(251,191,36,0.9)" }}>
          Long window—confirm that’s intentional for this opening.
        </p>
      ) : null}

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
        <span style={{ fontSize: 12, color: "var(--muted)" }}>CAD; useful for tracking recovered revenue.</span>
      </label>

      <label style={{ display: "grid", gap: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 600 }}>Notes (optional)</span>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          style={{ ...inputStyle, resize: "vertical", minHeight: 72 }}
        />
      </label>

      {fieldError ? <p style={{ margin: 0, fontSize: 13, color: "#f87171" }}>{fieldError}</p> : null}
      {createError ? <p style={{ margin: 0, fontSize: 13, color: "#f87171" }}>{createError}</p> : null}

      <button
        type="submit"
        disabled={submitting || optionsLoading}
        style={{
          ...pressablePrimary,
          justifySelf: "start",
          opacity: submitting || optionsLoading ? 0.65 : 1,
          cursor: submitting || optionsLoading ? "not-allowed" : "pointer",
        }}
        {...pressableHandlers(submitting || optionsLoading)}
      >
        {submitting ? "Creating…" : "Create open slot"}
      </button>
    </form>
  );
}
