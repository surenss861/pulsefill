const sectionStyle = { marginTop: 32 };
const headingStyle = { fontSize: 20, marginBottom: 8 };
const bodyStyle = { color: "var(--muted)", lineHeight: 1.6 };

export default function TermsPage() {
  return (
    <main style={{ padding: 48, maxWidth: 780, margin: "0 auto" }}>
      <h1 style={{ marginTop: 0 }}>Terms of Service</h1>
      <p style={bodyStyle}>
        <strong>Effective date:</strong> [TODO: set before publishing] &middot; Last updated: [TODO]
      </p>
      <p style={{ ...bodyStyle, fontStyle: "italic" }}>
        Draft for legal review — replace bracketed placeholders (company legal name, address, governing law,
        dispute-resolution terms) before this page is linked from App Store Connect or the app.
      </p>

      <section style={sectionStyle}>
        <h2 style={headingStyle}>1. What PulseFill is</h2>
        <p style={bodyStyle}>
          PulseFill connects businesses that have a cancelled appointment opening with customers on that
          business&rsquo;s standby list, so the opening can be filled quickly. PulseFill is a matching and
          notification service — the appointment itself is between you and the business.
        </p>
      </section>

      <section style={sectionStyle}>
        <h2 style={headingStyle}>2. Accounts</h2>
        <p style={bodyStyle}>
          You need an account to use PulseFill. You&rsquo;re responsible for keeping your login credentials secure
          and for activity that happens under your account. Provide accurate information and keep it up to date.
        </p>
      </section>

      <section style={sectionStyle}>
        <h2 style={headingStyle}>3. Customer standby &amp; claims</h2>
        <p style={bodyStyle}>
          Setting standby preferences does not guarantee you&rsquo;ll receive an opening, and claiming an opening
          does not guarantee the business will confirm it — the business makes the final call. When multiple
          customers try to claim the same opening, the first valid claim wins; you&rsquo;ll see a clear result
          either way.
        </p>
      </section>

      <section style={sectionStyle}>
        <h2 style={headingStyle}>4. Payments for paid openings</h2>
        <p style={bodyStyle}>
          Some businesses require payment to claim an opening. If you claim a paid opening, your payment method is
          authorized (held, not charged) through Stripe at claim time. If the business confirms the booking, the
          authorized amount is captured and PulseFill&rsquo;s platform fee is deducted before the remainder is paid
          out to the business. If the business does not confirm, or you lose the claim to another customer, the
          authorization is released and you are not charged. Refunds for confirmed, paid bookings are issued at the
          business&rsquo;s discretion through PulseFill&rsquo;s refund flow.
        </p>
      </section>

      <section style={sectionStyle}>
        <h2 style={headingStyle}>5. Business accounts &amp; payouts</h2>
        <p style={bodyStyle}>
          Businesses accepting paid claims must complete Stripe Connect onboarding and keep their account in good
          standing with Stripe. PulseFill deducts its platform fee from each paid, confirmed booking before payout.
          Businesses are responsible for the accuracy of their listed openings, prices, and confirmations, and for
          complying with applicable consumer-protection and payment-processing laws.
        </p>
      </section>

      <section style={sectionStyle}>
        <h2 style={headingStyle}>6. Subscription billing (businesses)</h2>
        <p style={bodyStyle}>
          Business workspaces may require an active PulseFill subscription, billed through Stripe, to use certain
          features (creating openings, sending offers, confirming bookings). Subscription terms, pricing, and
          cancellation are managed through the billing portal in the dashboard.
        </p>
      </section>

      <section style={sectionStyle}>
        <h2 style={headingStyle}>7. Acceptable use</h2>
        <p style={bodyStyle}>
          Don&rsquo;t misuse PulseFill: no fraud, no abusing the claim system, no harassing other users, no
          attempting to access another user&rsquo;s or business&rsquo;s data, and no interfering with the
          service&rsquo;s normal operation.
        </p>
      </section>

      <section style={sectionStyle}>
        <h2 style={headingStyle}>8. Termination</h2>
        <p style={bodyStyle}>
          You can delete your account at any time (see the Privacy Policy). We may suspend or terminate accounts
          that violate these terms or create risk for other users or the platform.
        </p>
      </section>

      <section style={sectionStyle}>
        <h2 style={headingStyle}>9. Disclaimers &amp; limitation of liability</h2>
        <p style={bodyStyle}>
          PulseFill is provided &ldquo;as is.&rdquo; We don&rsquo;t guarantee openings will be available, that a
          claimed opening will be confirmed, or that the service will be uninterrupted or error-free. To the extent
          permitted by law, PulseFill is not liable for indirect, incidental, or consequential damages arising from
          use of the service. [TODO: confirm liability cap and governing law with counsel.]
        </p>
      </section>

      <section style={sectionStyle}>
        <h2 style={headingStyle}>10. Changes to these terms</h2>
        <p style={bodyStyle}>
          We&rsquo;ll update the &ldquo;last updated&rdquo; date above when these terms change, and post material
          changes in the app or by email before they take effect.
        </p>
      </section>

      <section style={sectionStyle}>
        <h2 style={headingStyle}>Contact us</h2>
        <p style={bodyStyle}>
          <strong>[TODO: support email]</strong>
          <br />
          [TODO: company legal name and mailing address]
        </p>
      </section>
    </main>
  );
}
