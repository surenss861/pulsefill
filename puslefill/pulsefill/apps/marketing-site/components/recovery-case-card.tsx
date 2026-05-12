export function RecoveryCaseCard() {
  return (
    <article className="ms-rc-case" aria-label="Example recovery case">
      <div className="ms-rc-case-inner">
        <div className="ms-rc-case-rail" aria-hidden />
        <div className="ms-rc-case-main">
          <p className="ms-rc-case-overline">Cancelled appointment</p>
          <h3 className="ms-rc-case-service">Dental cleaning</h3>
          <p className="ms-rc-case-when">Today · 2:30 PM</p>
          <p className="ms-rc-case-where">Yorkville Wellness</p>
          <div className="ms-rc-case-status">
            <p>
              <span className="ms-rc-case-stat">9</span> waiting customers matched
            </p>
            <p className="ms-rc-case-claim">Maya R. claimed 3 min ago</p>
          </div>
          <button type="button" className="ms-rc-case-cta">
            Confirm booking
          </button>
          <p className="ms-rc-case-recover">
            Recover <span className="ms-rc-case-money">$185</span>
          </p>
        </div>
      </div>
    </article>
  );
}
