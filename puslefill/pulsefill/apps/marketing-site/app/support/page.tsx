const sectionStyle = { marginTop: 28 };
const headingStyle = { fontSize: 18, marginBottom: 6 };
const bodyStyle = { color: "var(--muted)", lineHeight: 1.6 };

export default function SupportPage() {
  return (
    <main style={{ padding: 48, maxWidth: 780, margin: "0 auto" }}>
      <h1 style={{ marginTop: 0 }}>Support</h1>
      <p style={bodyStyle}>
        Need help with PulseFill? Reach us at <strong>[TODO: support email]</strong> and we&rsquo;ll get back to you
        as soon as we can.
      </p>

      <section style={sectionStyle}>
        <h2 style={headingStyle}>I&rsquo;m a customer</h2>
        <p style={bodyStyle}>
          <strong>I have an invite code from a business.</strong> Open PulseFill, go to Profile, and enter the code
          under &ldquo;Use invite code.&rdquo;
        </p>
        <p style={bodyStyle}>
          <strong>I&rsquo;m not getting opening alerts.</strong> Check Profile → Notification settings, and make
          sure push notifications are allowed for PulseFill in your iPhone&rsquo;s Settings app. Also confirm you
          have an active standby preference for the service/time window you want.
        </p>
        <p style={bodyStyle}>
          <strong>I claimed an opening but it wasn&rsquo;t confirmed.</strong> The business still has to confirm a
          claim before it&rsquo;s a booked appointment. If they don&rsquo;t confirm, any payment authorization is
          released and you&rsquo;re not charged — check Activity for the latest status.
        </p>
        <p style={bodyStyle}>
          <strong>I want to delete my account.</strong> Go to Profile → Account → Delete account in the app. This
          is immediate and can&rsquo;t be undone.
        </p>
      </section>

      <section style={sectionStyle}>
        <h2 style={headingStyle}>I run a business on PulseFill</h2>
        <p style={bodyStyle}>
          <strong>Setting up payouts.</strong> Go to the dashboard&rsquo;s Billing page and complete Stripe Connect
          onboarding under &ldquo;Payouts&rdquo; before creating a paid opening.
        </p>
        <p style={bodyStyle}>
          <strong>Billing / subscription questions.</strong> Manage your plan from the dashboard&rsquo;s Billing
          page, or contact us at the email above.
        </p>
        <p style={bodyStyle}>
          <strong>An opening isn&rsquo;t reaching customers.</strong> Check that customers have joined your standby
          list and have matching preferences, and check the opening&rsquo;s notification log from its detail page.
        </p>
      </section>

      <section style={sectionStyle}>
        <h2 style={headingStyle}>Legal</h2>
        <p style={bodyStyle}>
          <a href="/privacy">Privacy Policy</a> &middot; <a href="/terms">Terms of Service</a>
        </p>
      </section>
    </main>
  );
}
