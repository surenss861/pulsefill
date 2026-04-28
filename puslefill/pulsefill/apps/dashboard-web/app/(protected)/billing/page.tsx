export default function BillingPage() {
  return (
    <main style={{ padding: 0, maxWidth: 900 }}>
      <h1 style={{ marginTop: 0 }}>Billing</h1>
      <p style={{ color: "var(--muted)", maxWidth: 620 }}>
        Manage your PulseFill plan, invoices, and billing details.
      </p>
      <div
        style={{
          marginTop: 20,
          borderRadius: 16,
          border: "1px solid rgba(255,255,255,0.1)",
          background: "rgba(255,255,255,0.03)",
          padding: 16,
        }}
      >
        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 650 }}>Billing is not connected yet</h2>
        <p style={{ margin: "8px 0 0", fontSize: 13, color: "var(--muted)", lineHeight: 1.6 }}>
          Plan management and invoices will appear here when billing is enabled.
        </p>
      </div>
    </main>
  );
}
