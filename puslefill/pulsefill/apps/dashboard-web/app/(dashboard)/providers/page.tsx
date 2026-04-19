"use client";

import { ActionEmptyState } from "@/components/ui/action-empty-state";
import { useStaffArrayResource } from "@/hooks/useStaffArrayResource";

export default function ProvidersPage() {
  const { items, loading, error } = useStaffArrayResource("/v1/providers");

  return (
    <main style={{ padding: 24 }}>
      <h1 style={{ marginTop: 0 }}>Providers</h1>
      <p style={{ color: "var(--muted)", maxWidth: 640 }}>
        Providers from <code style={{ color: "var(--primary)" }}>GET /v1/providers</code>.
      </p>

      {loading ? <p style={{ color: "var(--muted)", marginTop: 16 }}>Loading…</p> : null}
      {error ? <p style={{ color: "#f87171", marginTop: 16 }}>{error}</p> : null}

      {!loading && items.length === 0 ? (
        <div style={{ marginTop: 24 }}>
          <ActionEmptyState
            title="No providers yet"
            description="Add the providers who can take appointments so staff can attach openings to the right person."
            ctaLabel="Add provider"
            ctaHref="/overview#getting-started"
          />
        </div>
      ) : null}

      {!loading && items.length > 0 ? (
        <p style={{ marginTop: 24, color: "var(--muted)" }}>
          {items.length} provider{items.length === 1 ? "" : "s"} loaded. Full table editor ships next.
        </p>
      ) : null}
    </main>
  );
}
