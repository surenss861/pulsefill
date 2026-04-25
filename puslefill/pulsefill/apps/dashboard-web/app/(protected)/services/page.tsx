"use client";

import { ActionEmptyState } from "@/components/ui/action-empty-state";
import { useStaffArrayResource } from "@/hooks/useStaffArrayResource";

export default function ServicesPage() {
  const { items, loading, error } = useStaffArrayResource("/v1/services");

  return (
    <main style={{ padding: 24 }}>
      <h1 style={{ marginTop: 0 }}>Services</h1>
      <p style={{ color: "var(--muted)", maxWidth: 640 }}>
        Services from <code style={{ color: "var(--primary)" }}>GET /v1/services</code>.
      </p>

      {loading ? <p style={{ color: "var(--muted)", marginTop: 16 }}>Loading…</p> : null}
      {error ? <p style={{ color: "#f87171", marginTop: 16 }}>{error}</p> : null}

      {!loading && items.length === 0 ? (
        <div style={{ marginTop: 24 }}>
          <ActionEmptyState
            title="No services yet"
            description="Services help PulseFill match the right standby customers to the right opening."
            ctaLabel="Add service"
            ctaHref="/overview#getting-started"
          />
        </div>
      ) : null}

      {!loading && items.length > 0 ? (
        <p style={{ marginTop: 24, color: "var(--muted)" }}>
          {items.length} service{items.length === 1 ? "" : "s"} loaded. Full table editor ships next.
        </p>
      ) : null}
    </main>
  );
}
