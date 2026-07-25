const sectionStyle = { marginTop: 32 };
const headingStyle = { fontSize: 20, marginBottom: 8 };
const bodyStyle = { color: "var(--muted)", lineHeight: 1.6 };

export default function PrivacyPage() {
  return (
    <main style={{ padding: 48, maxWidth: 780, margin: "0 auto" }}>
      <h1 style={{ marginTop: 0 }}>Privacy Policy</h1>
      <p style={bodyStyle}>
        <strong>Effective date:</strong> [TODO: set before publishing] &middot; Last updated: [TODO]
      </p>
      <p style={{ ...bodyStyle, fontStyle: "italic" }}>
        Draft for legal review — replace bracketed placeholders (company legal name, address, contact email,
        governing jurisdiction) before this page is linked from App Store Connect or the app.
      </p>

      <p style={bodyStyle}>
        PulseFill (&ldquo;PulseFill,&rdquo; &ldquo;we,&rdquo; &ldquo;us&rdquo;) operates a service that helps
        businesses fill cancelled appointment openings by notifying customers on a standby list. This policy
        explains what we collect, why, and the choices you have — for both customers using the PulseFill app and
        staff using the PulseFill business dashboard.
      </p>

      <section style={sectionStyle}>
        <h2 style={headingStyle}>Information we collect</h2>
        <p style={bodyStyle}>
          <strong>Account information.</strong> Name, email address, and phone number when you create an account or
          accept a business invite.
        </p>
        <p style={bodyStyle}>
          <strong>Appointment &amp; standby data.</strong> The services, providers, locations, and time windows you
          mark as acceptable, plus the record of openings sent to you, claimed, and confirmed.
        </p>
        <p style={bodyStyle}>
          <strong>Push notification data.</strong> A device token used to deliver opening alerts, and your
          notification preferences (which channels and event types you want).
        </p>
        <p style={bodyStyle}>
          <strong>Payment information.</strong> When a business charges for a claimed opening, payment is processed
          by Stripe. PulseFill does not receive or store your full card number — we retain a reference to the
          transaction (amount, status) needed to resolve claims, confirmations, and refunds.
        </p>
        <p style={bodyStyle}>
          <strong>Usage &amp; device data.</strong> Basic technical data (app version, request identifiers) used for
          reliability and support — see &ldquo;Data we don&rsquo;t collect&rdquo; below for what we deliberately
          avoid.
        </p>
      </section>

      <section style={sectionStyle}>
        <h2 style={headingStyle}>Data we don&rsquo;t collect</h2>
        <p style={bodyStyle}>
          PulseFill does not use location services and does not track you across other apps or websites for
          advertising. We do not sell personal information.
        </p>
      </section>

      <section style={sectionStyle}>
        <h2 style={headingStyle}>How we use your information</h2>
        <ul style={{ ...bodyStyle, paddingLeft: 20 }}>
          <li>Match you with cancelled openings that fit your standby preferences</li>
          <li>Send push, SMS, or email notifications you&rsquo;ve opted into</li>
          <li>Process payments for paid claims through Stripe, including refunds</li>
          <li>Let a business you&rsquo;ve joined see your standby requests, claims, and booking history with them</li>
          <li>Provide customer support and investigate abuse or fraud</li>
          <li>Meet legal, tax, and accounting recordkeeping obligations</li>
        </ul>
      </section>

      <section style={sectionStyle}>
        <h2 style={headingStyle}>Who we share information with</h2>
        <p style={bodyStyle}>
          <strong>The business(es) you connect with.</strong> A business only sees the standby, claim, and booking
          data tied to their own workspace — not your activity with other businesses on PulseFill.
        </p>
        <p style={bodyStyle}>
          <strong>Service providers.</strong> Supabase (database and authentication), Stripe (payments and business
          payouts), Apple (push notification delivery), and our hosting providers (Railway, Vercel) process data on
          our behalf under their own security and privacy commitments.
        </p>
        <p style={bodyStyle}>
          <strong>Legal requirements.</strong> We may disclose information if required by law, or to protect the
          rights, safety, or property of PulseFill, our users, or the public.
        </p>
        <p style={bodyStyle}>We do not sell your personal information to third parties.</p>
      </section>

      <section style={sectionStyle}>
        <h2 style={headingStyle}>Data retention</h2>
        <p style={bodyStyle}>
          We keep account and activity data for as long as your account is active. Transaction records (claims,
          payments, confirmations) are retained after account deletion where needed for financial recordkeeping,
          dispute resolution, or legal compliance — with personal identifiers removed where possible. See
          &ldquo;Deleting your account&rdquo; below.
        </p>
      </section>

      <section style={sectionStyle}>
        <h2 style={headingStyle}>Deleting your account</h2>
        <p style={bodyStyle}>
          Customers can delete their account directly in the PulseFill app: <strong>Profile → Account → Delete
          account</strong>. This immediately removes your name, email, and phone number, turns off notifications,
          deactivates your standby preferences, and revokes app access. Records of past claims and payments are
          retained in de-identified form as described above. Business/staff accounts can request deletion by
          contacting support at the address below.
        </p>
      </section>

      <section style={sectionStyle}>
        <h2 style={headingStyle}>Your choices</h2>
        <ul style={{ ...bodyStyle, paddingLeft: 20 }}>
          <li>Turn push, SMS, or email notifications on or off at any time in the app</li>
          <li>Update or remove standby preferences whenever you like</li>
          <li>Request a copy of your data or ask us to correct it by contacting support</li>
          <li>Delete your account as described above</li>
        </ul>
      </section>

      <section style={sectionStyle}>
        <h2 style={headingStyle}>Children&rsquo;s privacy</h2>
        <p style={bodyStyle}>
          PulseFill is not directed to children under 13, and we do not knowingly collect personal information from
          children under 13.
        </p>
      </section>

      <section style={sectionStyle}>
        <h2 style={headingStyle}>Changes to this policy</h2>
        <p style={bodyStyle}>
          We&rsquo;ll update the &ldquo;last updated&rdquo; date above when this policy changes, and post material
          changes in the app or by email.
        </p>
      </section>

      <section style={sectionStyle}>
        <h2 style={headingStyle}>Contact us</h2>
        <p style={bodyStyle}>
          Questions about this policy or your data: <strong>[TODO: support email]</strong>
          <br />
          [TODO: company legal name and mailing address]
        </p>
      </section>
    </main>
  );
}
