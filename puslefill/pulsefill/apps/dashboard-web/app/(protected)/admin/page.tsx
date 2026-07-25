"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/api";

type StaffMatch = {
  id: string;
  business_id: string;
  auth_user_id: string;
  role: string;
  full_name: string | null;
  email: string | null;
  created_at: string;
  businesses?: { name: string } | null;
};

type CustomerMatch = {
  id: string;
  auth_user_id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  deleted_at: string | null;
  created_at: string;
};

type AuditEvent = {
  id: string;
  event_type: string;
  entity_type: string;
  entity_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

type PushDevice = {
  id: string;
  platform: string;
  environment: string;
  active: boolean;
  device_token: string;
  updated_at: string;
};

const boxStyle: React.CSSProperties = {
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.1)",
  background: "rgba(255,255,255,0.03)",
  padding: 16,
  marginTop: 16,
};

const inputStyle: React.CSSProperties = {
  borderRadius: 8,
  border: "1px solid rgba(255,255,255,0.15)",
  background: "rgba(0,0,0,0.2)",
  color: "inherit",
  padding: "8px 10px",
  fontSize: 13,
  marginRight: 8,
};

const preStyle: React.CSSProperties = {
  fontSize: 12,
  whiteSpace: "pre-wrap",
  wordBreak: "break-all",
  background: "rgba(0,0,0,0.25)",
  padding: 10,
  borderRadius: 8,
  marginTop: 8,
};

function ErrorNote({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p style={{ color: "#f87171", fontSize: 13, marginTop: 8 }}>{message}</p>
  );
}

function UserLookupBox() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customer, setCustomer] = useState<CustomerMatch | null>(null);
  const [staff, setStaff] = useState<StaffMatch[]>([]);
  const [audit, setAudit] = useState<AuditEvent[] | null>(null);

  async function lookup() {
    setLoading(true);
    setError(null);
    setAudit(null);
    try {
      const res = await apiFetch<{ customer: CustomerMatch | null; staff: StaffMatch[] }>(
        `/v1/admin/users/lookup?email=${encodeURIComponent(email.trim())}`,
      );
      setCustomer(res.customer);
      setStaff(res.staff);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lookup failed.");
      setCustomer(null);
      setStaff([]);
    } finally {
      setLoading(false);
    }
  }

  async function loadAudit(actorId: string) {
    try {
      const res = await apiFetch<{ events: AuditEvent[] }>(`/v1/admin/actors/${actorId}/audit`);
      setAudit(res.events);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Audit lookup failed.");
    }
  }

  return (
    <div style={boxStyle}>
      <h2 style={{ marginTop: 0, fontSize: 16 }}>User lookup</h2>
      <input
        style={inputStyle}
        placeholder="email@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && void lookup()}
      />
      <button onClick={() => void lookup()} disabled={loading || !email.trim()}>
        {loading ? "Looking up…" : "Look up"}
      </button>
      <ErrorNote message={error} />

      {customer ? (
        <div style={{ marginTop: 12 }}>
          <strong>Customer</strong>
          <pre style={preStyle}>{JSON.stringify(customer, null, 2)}</pre>
          <button onClick={() => void loadAudit(customer.id)}>Load audit trail</button>
        </div>
      ) : null}

      {staff.length > 0 ? (
        <div style={{ marginTop: 12 }}>
          <strong>Staff ({staff.length} business{staff.length === 1 ? "" : "es"})</strong>
          {staff.map((s) => (
            <div key={s.id} style={{ marginTop: 8 }}>
              <pre style={preStyle}>{JSON.stringify(s, null, 2)}</pre>
              <button onClick={() => void loadAudit(s.id)}>Load audit trail</button>
            </div>
          ))}
        </div>
      ) : null}

      {customer === null && staff.length === 0 && !loading && !error ? null : null}

      {audit ? (
        <div style={{ marginTop: 12 }}>
          <strong>Recent audit events ({audit.length})</strong>
          <pre style={preStyle}>{JSON.stringify(audit, null, 2)}</pre>
        </div>
      ) : null}
    </div>
  );
}

function SlotLookupBox() {
  const [slotId, setSlotId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<unknown>(null);

  async function lookup() {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch(`/v1/admin/open-slots/${slotId.trim()}`);
      setResult(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lookup failed.");
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={boxStyle}>
      <h2 style={{ marginTop: 0, fontSize: 16 }}>Open slot lifecycle</h2>
      <input
        style={inputStyle}
        placeholder="open_slot_id (uuid)"
        value={slotId}
        onChange={(e) => setSlotId(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && void lookup()}
      />
      <button onClick={() => void lookup()} disabled={loading || !slotId.trim()}>
        {loading ? "Looking up…" : "Look up"}
      </button>
      <ErrorNote message={error} />
      {result ? <pre style={preStyle}>{JSON.stringify(result, null, 2)}</pre> : null}
    </div>
  );
}

function PaymentLookupBox() {
  const [value, setValue] = useState("");
  const [mode, setMode] = useState<"claim_id" | "payment_intent_id">("claim_id");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<unknown>(null);

  async function lookup() {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch(`/v1/admin/payments/lookup?${mode}=${encodeURIComponent(value.trim())}`);
      setResult(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lookup failed.");
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={boxStyle}>
      <h2 style={{ marginTop: 0, fontSize: 16 }}>Payment status</h2>
      <select style={{ ...inputStyle, padding: "8px 6px" }} value={mode} onChange={(e) => setMode(e.target.value as typeof mode)}>
        <option value="claim_id">claim_id</option>
        <option value="payment_intent_id">payment_intent_id</option>
      </select>
      <input
        style={inputStyle}
        placeholder={mode === "claim_id" ? "claim id (uuid)" : "pi_..."}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && void lookup()}
      />
      <button onClick={() => void lookup()} disabled={loading || !value.trim()}>
        {loading ? "Looking up…" : "Look up"}
      </button>
      <ErrorNote message={error} />
      {result ? <pre style={preStyle}>{JSON.stringify(result, null, 2)}</pre> : null}
    </div>
  );
}

function PushDevicesBox() {
  const [customerId, setCustomerId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [devices, setDevices] = useState<PushDevice[] | null>(null);

  async function lookup() {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<{ devices: PushDevice[] }>(`/v1/admin/customers/${customerId.trim()}/push-devices`);
      setDevices(res.devices);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lookup failed.");
      setDevices(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={boxStyle}>
      <h2 style={{ marginTop: 0, fontSize: 16 }}>Push device status</h2>
      <input
        style={inputStyle}
        placeholder="customer_id (uuid)"
        value={customerId}
        onChange={(e) => setCustomerId(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && void lookup()}
      />
      <button onClick={() => void lookup()} disabled={loading || !customerId.trim()}>
        {loading ? "Looking up…" : "Look up"}
      </button>
      <ErrorNote message={error} />
      {devices ? <pre style={preStyle}>{JSON.stringify(devices, null, 2)}</pre> : null}
    </div>
  );
}

export default function AdminPage() {
  return (
    <main style={{ padding: 32, maxWidth: 900 }}>
      <h1 style={{ marginBottom: 4 }}>Admin / support</h1>
      <p style={{ color: "var(--muted)", fontSize: 13, margin: 0 }}>
        Internal tool. Every lookup here calls a <code>/v1/admin/*</code> endpoint gated by{" "}
        <code>PLATFORM_ADMIN_EMAILS</code> — if you can&apos;t see results, your account isn&apos;t on that
        allowlist.
      </p>
      <UserLookupBox />
      <SlotLookupBox />
      <PaymentLookupBox />
      <PushDevicesBox />
    </main>
  );
}
