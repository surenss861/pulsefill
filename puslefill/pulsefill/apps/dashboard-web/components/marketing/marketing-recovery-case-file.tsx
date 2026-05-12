"use client";

/**
 * Public marketing hero — operational case file (matches marketing-site RecoveryCaseFile).
 * Rendered by dashboard-web `/` so production on pulsefill.vercel.app shows this, not a SaaS mock.
 */
export function MarketingRecoveryCaseFile() {
  return (
    <article className="ms-rc-file" aria-label="Example cancelled-appointment recovery file">
      <div className="ms-rc-file-inner">
        <div className="ms-rc-file-rail" aria-hidden />
        <div className="ms-rc-file-sheet">
          <header className="ms-rc-file-header">
            <span className="ms-rc-file-kicker">Cancelled appointment</span>
            <span className="ms-rc-file-urgency">Needs confirmation</span>
          </header>

          <div className="ms-rc-file-appointment">
            <h3 className="ms-rc-file-service">Dental cleaning</h3>
            <p className="ms-rc-file-when">Today · 2:30 PM</p>
            <p className="ms-rc-file-where">Yorkville Wellness</p>
          </div>

          <div className="ms-rc-file-recovery">
            <p className="ms-rc-file-recovery-label">Recovery</p>
            <p className="ms-rc-file-line">
              <span className="ms-rc-file-num">9</span> matched customers
            </p>
            <p className="ms-rc-file-line">
              <span className="ms-rc-file-num">3</span> offers sent
            </p>
            <p className="ms-rc-file-line ms-rc-file-line--claim">Maya R. claimed 3 min ago</p>
          </div>

          <div className="ms-rc-file-action">
            <button type="button" className="ms-rc-file-cta">
              Confirm booking
            </button>
            <p className="ms-rc-file-recover">
              Recover <span className="ms-rc-file-money">$185</span>
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}
