/**
 * Compact case-file preview for the sign-in route — same story language as marketing hero.
 */
export function AuthSignInPreview() {
  return (
    <article
      className="ms-rc-file ms-rc-file--compact pf-auth-recovery-preview pf-auth-shell-enter"
      aria-label="Example cancelled appointment recovery"
    >
      <div className="ms-rc-file-inner">
        <div className="ms-rc-file-rail ms-rc-file-rail--idle" aria-hidden />
        <div className="ms-rc-file-sheet">
          <div className="pf-auth-preview-head">
            <p className="ms-rc-file-kicker" style={{ margin: 0 }}>
              Cancelled appointment
            </p>
            <p className="pf-auth-preview-title">Dental cleaning · Today 2:30 PM</p>
          </div>
          <div className="pf-auth-preview-body">
            <p className="ms-rc-file-line">
              <span className="ms-rc-file-num">9</span> matched customers
            </p>
            <p className="ms-rc-file-line ms-rc-file-line--claim">Maya R. claimed 3 min ago</p>
            <p className="ms-rc-file-line" style={{ marginTop: 10 }}>
              Recover <span className="ms-rc-file-money">$185</span>
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}
