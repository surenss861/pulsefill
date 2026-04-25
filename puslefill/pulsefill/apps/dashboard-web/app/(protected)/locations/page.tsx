"use client";

import { ActionEmptyState } from "@/components/ui/action-empty-state";
import { useStaffArrayResource } from "@/hooks/useStaffArrayResource";

export default function LocationsPage() {
  const { items, loading, error } = useStaffArrayResource("/v1/locations");

  return (
    <main style={{ padding: 24 }}>
      <h1 style={{ marginTop: 0 }}>Locations</h1>
      <p style={{ color: "var(--muted)", maxWidth: 640 }}>
        Locations for your business from <code style={{ color: "var(--primary)" }}>GET /v1/locations</code>.
      </p>

      {loading ? <p style={{ color: "var(--muted)", marginTop: 16 }}>Loading…</p> : null}
      {error ? <p style={{ color: "#f87171", marginTop: 16 }}>{error}</p> : null}

      {!loading && items.length === 0 ? (
        <div style={{ marginTop: 24 }}>
          <ActionEmptyState
            title="No locations yet"
            description="Add at least one location so PulseFill knows where openings belong."
            ctaLabel="Add location"
            ctaHref="/overview#getting-started"
          />
        </div>
      ) : null}

      {!loading && items.length > 0 ? (
        <p style={{ marginTop: 24, color: "var(--muted)" }}>
          {items.length} location{items.length === 1 ? "" : "s"} loaded. Full table editor ships next.
        </p>
      ) : null}
    </main>
  );
}
