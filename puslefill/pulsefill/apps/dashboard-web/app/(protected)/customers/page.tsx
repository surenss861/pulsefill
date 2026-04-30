"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type CSSProperties } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { PageCommandHeader } from "@/components/operator/page-command-header";
import { OperatorMetricStrip } from "@/components/operator/operator-metric-strip";
import { actionLinkStyle } from "@/lib/operator-action-link-styles";
import { usePendingStandbyRequests } from "@/hooks/usePendingStandbyRequests";
import { apiFetch } from "@/lib/api";
import { operatorSurfaceShell } from "@/lib/operator-surface-styles";

type CustomerInviteRow = {
  id: string;
  email: string;
  status: string;
  expires_at: string;
  created_at: string;
  accepted_at: string | null;
};

type CreateInviteResponse = CustomerInviteRow & {
  invite_url: string | null;
  one_time_token: string;
  expires_in_days: number;
};

async function copyToClipboard(value: string): Promise<void> {
  if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
    throw new Error("Clipboard not available");
  }
  await navigator.clipboard.writeText(value);
}

export default function CustomersPage() {
  function toCustomerInviteError(err: unknown, fallback: string): string {
    if (!(err instanceof Error)) return fallback;
    const msg = err.message.trim();
    const lower = msg.toLowerCase();
    if (lower.includes("not found")) return "Customer invites are not available yet.";
    return msg.length > 0 ? msg : fallback;
  }

  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [invites, setInvites] = useState<CustomerInviteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [lastCreated, setLastCreated] = useState<CreateInviteResponse | null>(null);
  const [copyState, setCopyState] = useState<string | null>(null);
  const standbyPending = usePendingStandbyRequests(60_000);
  const reduceMotion = useReducedMotion();
  const pendingInvites = invites.filter((i) => i.status === "pending").length;
  const acceptedInvites = invites.filter((i) => i.status === "accepted").length;
  const matchCoverage =
    acceptedInvites > 0
      ? "Customers are connected; ask them to enable standby preferences."
      : "Invite customers first to build standby coverage.";

  const load = useCallback(async () => {
    try {
      setListError(null);
      setLoading(true);
      const data = await apiFetch<{ invites: CustomerInviteRow[] }>("/v1/customers/invites");
      setInvites(Array.isArray(data.invites) ? data.invites : []);
    } catch (err) {
      setListError(toCustomerInviteError(err, "Couldn’t load invites. Please try again."));
      setInvites([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setLastCreated(null);
    if (!email.trim()) {
      setFormError("Email is required.");
      return;
    }
    setSaving(true);
    try {
      const res = await apiFetch<CreateInviteResponse>("/v1/customers/invites", {
        method: "POST",
        body: JSON.stringify({ email: email.trim() }),
      });
      setLastCreated(res);
      setCopyState(null);
      setEmail("");
      await load();
    } catch (err) {
      setFormError(toCustomerInviteError(err, "Couldn’t create invite. Please try again."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="pf-page-customers" style={{ padding: 0 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <PageCommandHeader
          tone="default"
          eyebrow="Customers"
          title="Standby pool"
          description="Invite customers to join standby so PulseFill can match them to new openings."
          primaryAction={
            <Link href="#invite-customer" style={actionLinkStyle("primary")}>
              Invite customer
            </Link>
          }
          secondaryAction={
            standbyPending.count > 0 ? (
              reduceMotion ? (
                <Link href="/customers/standby-requests" style={actionLinkStyle("secondary")}>
                  Standby requests
                </Link>
              ) : (
                <motion.span
                  animate={{ opacity: [1, 0.88, 1] }}
                  transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                  style={{ display: "inline-block" }}
                >
                  <Link href="/customers/standby-requests" style={actionLinkStyle("secondary")}>
                    Standby requests
                  </Link>
                </motion.span>
              )
            ) : (
              <Link href="/customers/standby-requests" style={actionLinkStyle("secondary")}>
                Standby requests
              </Link>
            )
          }
        />

        <div
          style={{
            ...operatorSurfaceShell("quiet"),
            padding: "14px 16px",
            fontSize: 13,
            lineHeight: 1.55,
            color: "rgba(245,247,250,0.78)",
          }}
        >
          <Link href="/customers/standby-requests" style={{ color: "var(--pf-accent-primary)", fontWeight: 600 }}>
            Standby requests
          </Link>
          <span style={{ color: "var(--muted)" }}> — review customers who asked to join when you use request-to-join access.</span>
        </div>

        <OperatorMetricStrip
          items={[
            { label: "Pending invites", value: pendingInvites, hint: "Awaiting acceptance" },
            { label: "Active standby", value: acceptedInvites, emphasis: "primary", hint: "Ready for offers" },
            {
              label: "Match coverage",
              value: acceptedInvites > 0 ? "Improving" : "Low",
              signal: acceptedInvites > 0 ? "live" : "idle",
              emphasis: acceptedInvites > 0 ? "primary" : "default",
              hint: acceptedInvites > 0 ? "Standby pool in play" : "Invite more standby customers",
            },
          ]}
          compact
        />
        <p className="pf-muted-copy" style={{ margin: 0, fontSize: 12, lineHeight: 1.45 }}>
          {matchCoverage}
        </p>

        <div className="pf-customers-split" style={{ marginTop: 4 }}>
        <form
          id="invite-customer"
          onSubmit={onSubmit}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
            padding: 18,
            ...operatorSurfaceShell("operational"),
          }}
        >
          <h2 className="pf-section-title" style={{ fontSize: 16 }}>
            Invite customer
          </h2>
          <p className="pf-muted-copy" style={{ margin: 0, fontSize: 13 }}>
            Create an invite code and share it with the customer so they can join your standby list.
          </p>
          <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13 }}>
            <span style={{ color: "var(--muted)" }}>Email *</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="patients@example.com"
              required
              style={{
                borderRadius: 12,
                border: "1px solid var(--pf-border-default)",
                background: "var(--pf-auth-input-bg)",
                color: "var(--text)",
                padding: "10px 12px",
                fontSize: 14,
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
              }}
            />
          </label>
          {formError ? <p style={{ color: "#f87171", margin: 0, fontSize: 13 }}>{formError}</p> : null}
          <button
            type="submit"
            disabled={saving}
            style={{
              borderRadius: 12,
              border: "1px solid var(--pf-accent-primary-border)",
              background: "linear-gradient(180deg, #ff7a18 0%, #f97316 100%)",
              color: "var(--pf-btn-primary-text)",
              padding: "10px 16px",
              fontSize: 14,
              fontWeight: 700,
              cursor: saving ? "wait" : "pointer",
              alignSelf: "flex-start",
              boxShadow: "0 10px 28px rgba(255, 122, 24, 0.28)",
            }}
          >
            {saving ? "Creating…" : "Create invite code"}
          </button>
        </form>

        <div
          style={{
            padding: 18,
            ...operatorSurfaceShell("quiet"),
          }}
        >
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 650 }}>Standby coverage</h2>
          <p style={{ margin: "8px 0 0", color: "var(--muted)", fontSize: 13, lineHeight: 1.6 }}>
            Customers receive offers after accepting an invite and enabling standby preferences.
          </p>
          <p style={{ margin: "8px 0 0", color: "var(--muted)", fontSize: 13, lineHeight: 1.6 }}>
            If <strong>Send offers</strong> finds no matches, invite more customers or ask connected customers to finish standby setup.
          </p>
          <p style={{ margin: "10px 0 0", fontSize: 13 }}>
            <Link href="/open-slots?status=open" style={{ color: "var(--primary)", fontWeight: 600 }}>
              Review openings
            </Link>
          </p>
        </div>
        </div>

      {lastCreated ? (
        <div
          style={{
            marginTop: 20,
            padding: 16,
            borderRadius: 14,
            border: "1px solid rgba(34,197,94,0.35)",
            background: "rgba(34,197,94,0.08)",
            fontSize: 13,
            lineHeight: 1.5,
            maxWidth: 720,
          }}
        >
          <strong style={{ display: "block", marginBottom: 8 }}>Invite created</strong>
          {lastCreated.invite_url ? (
            <p style={{ margin: "0 0 8px" }}>
              <code style={{ wordBreak: "break-all", fontSize: 12 }}>{lastCreated.invite_url}</code>
            </p>
          ) : (
            <p style={{ margin: "0 0 8px", color: "var(--muted)" }}>
              Invite link unavailable in this environment. You can still copy and share the invite code below.
            </p>
          )}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
            {lastCreated.invite_url ? (
              <button
                type="button"
                onClick={async () => {
                  try {
                    await copyToClipboard(lastCreated.invite_url!);
                    setCopyState("url");
                  } catch {
                    setCopyState(null);
                  }
                }}
                style={copyButton}
              >
                {copyState === "url" ? "Copied" : "Copy invite URL"}
              </button>
            ) : null}
            <button
              type="button"
              onClick={async () => {
                try {
                  await copyToClipboard(lastCreated.one_time_token);
                  setCopyState("token");
                } catch {
                  setCopyState(null);
                }
              }}
              style={copyButton}
            >
              {copyState === "token" ? "Copied" : "Copy one-time token"}
            </button>
          </div>
        </div>
      ) : null}

      {loading ? <p style={{ color: "var(--muted)", marginTop: 24 }}>Loading invites…</p> : null}
      {listError ? <p style={{ color: "#f87171", marginTop: 16 }}>{listError}</p> : null}

      {!loading && !listError && invites.length === 0 ? (
        <div
          style={{
            marginTop: 20,
            padding: 16,
            ...operatorSurfaceShell("emptyState"),
          }}
        >
          <p style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>No pending invites yet</p>
          <p style={{ margin: "6px 0 0", color: "var(--muted)", fontSize: 13, lineHeight: 1.5 }}>
            Invite your first customer so they can receive earlier-opening offers.
          </p>
        </div>
      ) : null}

      <div style={{ marginTop: 20 }}>
        <h2 style={{ fontSize: 15, fontWeight: 650, marginBottom: 8, letterSpacing: "-0.02em" }}>Pending invites</h2>
        {!loading && !listError && invites.length > 0 ? (
          <div
            style={{
              borderRadius: 12,
              overflow: "hidden",
              border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(0,0,0,0.2)",
            }}
          >
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "rgba(255,255,255,0.04)" }}>
                  <th style={thStyle}>Email</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Created</th>
                </tr>
              </thead>
              <tbody>
                {invites.map((r) => (
                  <tr key={r.id}>
                    <td style={tdStyle}>{r.email}</td>
                    <td style={tdStyle}>
                      {r.status}
                      {r.status === "pending" ? ` · expires ${new Date(r.expires_at).toLocaleDateString()}` : null}
                    </td>
                    <td style={tdStyle}>{new Date(r.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
      </div>
    </main>
  );
}

const copyButton: CSSProperties = {
  borderRadius: 8,
  border: "1px solid rgba(255,255,255,0.18)",
  background: "rgba(255,255,255,0.08)",
  color: "var(--text)",
  padding: "8px 12px",
  fontSize: 12,
  cursor: "pointer",
};

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
