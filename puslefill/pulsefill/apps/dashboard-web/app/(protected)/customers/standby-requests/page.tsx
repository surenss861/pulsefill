"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ActionButton } from "@/components/ui/action-button";
import { actionLinkStyle } from "@/lib/operator-action-link-styles";
import { PageCommandHeader } from "@/components/operator/page-command-header";
import { OperatorPageTransition } from "@/components/operator/operator-page-transition";
import { MotionAction, MotionTapSurface } from "@/components/operator/operator-motion-primitives";
import { OperatorErrorState } from "@/components/operator/operator-error-state";
import { OperatorListEmptyState } from "@/components/operator/operator-list-empty-state";
import { OperatorLoadingState } from "@/components/operator/operator-loading-state";
import { apiFetch } from "@/lib/api";
import { operatorSurfaceShell } from "@/lib/operator-surface-styles";

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
    <main className="pf-page-standby-requests" style={{ padding: 0 }}>
      <PageCommandHeader
        animate={false}
        tone="default"
        eyebrow="Standby access"
        title="Standby requests"
        description="Review customers who asked to join your standby pool. Approve when you are ready for them to set preferences and receive openings."
        secondaryAction={
          <MotionAction>
            <Link href="/customers" style={actionLinkStyle("secondary")}>
              Back to customers
            </Link>
          </MotionAction>
        }
        style={{ marginBottom: 16 }}
      />

      <OperatorPageTransition>
      {error ? (
        <div style={{ marginTop: 12 }}>
          <OperatorErrorState rawMessage={error} />
        </div>
      ) : null}

      {loading ? (
        <div style={{ marginTop: 16 }}>
          <OperatorLoadingState variant="section" skeleton="rows" title="Loading requests…" />
        </div>
      ) : requests.length === 0 ? (
        <div style={{ marginTop: 16 }}>
          <OperatorListEmptyState
            title="No standby requests"
            description='Customer requests will appear here when your access mode is request-to-join and your business is listed.'
            primaryAction={
              <MotionAction>
                <Link href="/settings" style={actionLinkStyle("primary")}>
                  Review access settings
                </Link>
              </MotionAction>
            }
            secondaryAction={
              <MotionAction>
                <Link href="/customers" style={actionLinkStyle("secondary")}>
                  Back to customers
                </Link>
              </MotionAction>
            }
          />
        </div>
      ) : (
        <ul style={{ listStyle: "none", margin: "18px 0 0", padding: 0, display: "flex", flexDirection: "column", gap: 10 }}>
          {requests.map((r) => (
            <li
              key={r.id}
              className="pf-standby-request-row"
              style={{
                padding: 16,
                ...operatorSurfaceShell("operational"),
              }}
            >
              <p className="pf-section-title" style={{ fontSize: 15 }}>
                {r.customer_label ?? r.customer_id}
              </p>
              <p className="pf-meta-row" style={{ margin: "6px 0 0" }}>
                Requested {new Date(r.requested_at).toLocaleString()}
              </p>
              {r.message ? <p className="pf-muted-copy" style={{ margin: "10px 0 0", fontSize: 14 }}>{r.message}</p> : null}
              <div className="pf-standby-request-actions" style={{ marginTop: 14, display: "flex", flexWrap: "wrap", gap: 10 }}>
                <MotionTapSurface disabled={acting === r.id}>
                  <ActionButton variant="primary" disabled={acting === r.id} onClick={() => void review(r.id, "approve")}>
                    Approve
                  </ActionButton>
                </MotionTapSurface>
                <MotionTapSurface disabled={acting === r.id}>
                  <ActionButton variant="secondary" disabled={acting === r.id} onClick={() => void review(r.id, "decline")}>
                    Decline
                  </ActionButton>
                </MotionTapSurface>
              </div>
            </li>
          ))}
        </ul>
      )}
      </OperatorPageTransition>
    </main>
  );
}
