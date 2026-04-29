"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ActionButton, actionLinkStyle } from "@/components/ui/action-button";
import { PageIntroCard } from "@/components/ui/page-intro-card";
import { PageState } from "@/components/ui/page-state";
import { apiFetch } from "@/lib/api";

type StandbyRequestRow = {
  id: string;
  customer_id: string;
  status: string;
  message: string | null;
  requested_at: string;
  customer_label?: string | null;
};

export default function StandbyRequestsPage() {
  const [requests, setRequests] = useState<StandbyRequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [acting, setActing] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const data = await apiFetch<{ requests: StandbyRequestRow[] }>(
        "/v1/businesses/mine/customer-standby-requests?status=pending",
      );
      setRequests(Array.isArray(data.requests) ? data.requests : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load requests.");
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function review(id: string, decision: "approve" | "decline") {
    setActing(id);
    setError(null);
    try {
      await apiFetch(`/v1/businesses/mine/customer-standby-requests/${id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision }),
      });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed.");
    } finally {
      setActing(null);
    }
  }

  return (
    <main style={{ padding: 0, maxWidth: 880 }}>
      <PageIntroCard
        tone="elevated"
        layout="split"
        overline="Customers"
        title="Standby requests"
        description="Review customers who asked to join your standby pool. Approve when you are ready for them to set preferences and receive openings."
        actions={
          <Link href="/customers" style={actionLinkStyle("secondary")}>
            Back to customers
          </Link>
        }
      />

      {error ? (
        <p style={{ color: "#f87171", marginTop: 16 }}>{error}</p>
      ) : null}

      {loading ? (
        <PageState variant="info" title="Loading" description="Fetching pending requests…" style={{ marginTop: 20 }} />
      ) : requests.length === 0 ? (
        <PageState
          variant="empty"
          title="No pending requests"
          description="When access mode is “request to join” and your business is listed, new requests appear here."
          style={{ marginTop: 20 }}
        />
      ) : (
        <ul style={{ listStyle: "none", margin: "24px 0 0", padding: 0, display: "flex", flexDirection: "column", gap: 12 }}>
          {requests.map((r) => (
            <li
              key={r.id}
              style={{
                borderRadius: 16,
                border: "1px solid rgba(255,255,255,0.1)",
                background: "rgba(255,255,255,0.04)",
                padding: 16,
              }}
            >
              <p style={{ margin: 0, fontSize: 15, fontWeight: 650 }}>{r.customer_label ?? r.customer_id}</p>
              <p style={{ margin: "8px 0 0", fontSize: 12, color: "var(--muted)" }}>
                Requested {new Date(r.requested_at).toLocaleString()}
              </p>
              {r.message ? (
                <p style={{ margin: "10px 0 0", fontSize: 14, color: "rgba(245,247,250,0.78)" }}>{r.message}</p>
              ) : null}
              <div style={{ marginTop: 14, display: "flex", flexWrap: "wrap", gap: 10 }}>
                <ActionButton variant="primary" disabled={acting === r.id} onClick={() => void review(r.id, "approve")}>
                  Approve
                </ActionButton>
                <ActionButton variant="secondary" disabled={acting === r.id} onClick={() => void review(r.id, "decline")}>
                  Decline
                </ActionButton>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
