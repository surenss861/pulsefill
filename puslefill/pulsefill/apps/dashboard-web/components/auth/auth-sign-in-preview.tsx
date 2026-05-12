/**
 * Recovery file preview for sign-in — same structure and story language as the marketing hero case file.
 */
export function AuthSignInPreview() {
  return (
    <article
      className="ms-rc-file pf-auth-recovery-preview pf-auth-shell-enter"
      aria-label="Example cancelled appointment recovery"
    >
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
            <p className="ms-rc-file-line">
              <span className="ms-rc-file-num">9</span> matched customers
            </p>
            <p className="ms-rc-file-line ms-rc-file-line--claim">Maya R. claimed 3 min ago</p>
            <p className="ms-rc-file-recover pf-auth-preview-recover-line">
              Recover <span className="ms-rc-file-money">$185</span>
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}
