import Link from "next/link";

/**
 * There is no staff API in this repo to create customers or standby preferences.
 * They are created by the customer app (POST /v1/customers/me/preferences with requireCustomer)
 * or by dev seeds / Supabase. Operators learn why “Send offers” can return no matches on /open-slots.
 */
export default function CustomersPage() {
  return (
    <main style={{ padding: 24, maxWidth: 720 }}>
      <h1 style={{ marginTop: 0 }}>Customers & standby</h1>
      <p style={{ color: "var(--muted)", lineHeight: 1.6, marginTop: 8 }}>
        PulseFill sends open-slot offers to people who have an <strong>active standby preference</strong> for
        your business. Preferences are stored per customer and matched to each slot (location, service, provider, time
        window, and other rules) on the server when you use <strong>Send offers</strong>.
      </p>
      <p style={{ color: "var(--muted)", lineHeight: 1.6, marginTop: 14 }}>
        <strong>Production:</strong> customers and preferences typically come from your patient-facing app (or future
        admin import). The operator dashboard does not create customer accounts here yet.
      </p>
      <p style={{ color: "var(--muted)", lineHeight: 1.6, marginTop: 14 }}>
        <strong>Development:</strong> use <code>apps/api</code> seed scripts (e.g. customer flow seed) or insert rows
        in Supabase so <code>customers</code> and <code>standby_preferences</code> exist for your business. Until then,{" "}
        <code>POST /v1/open-slots/:id/send-offers</code> may return <em>no matches</em> and the overview{" "}
        <strong>Offers sent</strong> count will stay at 0.
      </p>
      <p style={{ marginTop: 20 }}>
        <Link href="/open-slots?status=open" style={{ color: "var(--primary)", fontWeight: 600 }}>
          Go to open slots
        </Link>{" "}
        ·{" "}
        <Link href="/overview#getting-started" style={{ color: "var(--primary)", fontWeight: 600 }}>
          Setup checklist
        </Link>
      </p>
    </main>
  );
}
