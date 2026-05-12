"use client";

/**
 * Product-section payoff: operator queue + standby offer as case files (no browser / phone chrome).
 */
export function PayoffProductVisual() {
  return (
    <div className="ms-rc-payoff-layout">
      <div className="ms-rc-payoff-stack" aria-label="Example operator recovery cases">
        <article className="ms-rc-file ms-rc-file--compact" aria-label="Example hygiene recovery case">
          <div className="ms-rc-file-inner">
            <div className="ms-rc-file-rail" aria-hidden />
            <div className="ms-rc-file-sheet">
              <header className="ms-rc-file-header">
                <span className="ms-rc-file-kicker">Recovery queue</span>
                <span className="ms-rc-file-urgency">Awaiting confirm</span>
              </header>
              <div className="ms-rc-file-appointment">
                <h3 className="ms-rc-file-service">Hygiene visit</h3>
                <p className="ms-rc-file-when">Today · 11:15 AM</p>
                <p className="ms-rc-file-where">Eastside Dental</p>
              </div>
              <div className="ms-rc-file-recovery">
                <p className="ms-rc-file-recovery-label">Recovery</p>
                <p className="ms-rc-file-line">
                  <span className="ms-rc-file-num">4</span> matched in queue
                </p>
                <p className="ms-rc-file-line">
                  <span className="ms-rc-file-num">1</span> offer sent · 8 min ago
                </p>
                <p className="ms-rc-file-line ms-rc-file-line--claim">Alex K. claimed 2 min ago</p>
              </div>
              <div className="ms-rc-file-action ms-rc-file-action--quiet">
                <p className="ms-rc-file-foot">Desk confirms once; calendar and attribution stay in sync.</p>
                <p className="ms-rc-file-recover">
                  Recover <span className="ms-rc-file-money">$210</span>
                </p>
              </div>
            </div>
          </div>
        </article>

        <article className="ms-rc-file ms-rc-file--compact" aria-label="Example upcoming slot case">
          <div className="ms-rc-file-inner">
            <div className="ms-rc-file-rail ms-rc-file-rail--idle" aria-hidden />
            <div className="ms-rc-file-sheet">
              <header className="ms-rc-file-header">
                <span className="ms-rc-file-kicker">Cancelled slot</span>
                <span className="ms-rc-file-urgency">Offers pending</span>
              </header>
              <div className="ms-rc-file-appointment">
                <h3 className="ms-rc-file-service">Botox consult</h3>
                <p className="ms-rc-file-when">Tomorrow · 9:00 AM</p>
                <p className="ms-rc-file-where">Yorkville Wellness</p>
              </div>
              <div className="ms-rc-file-recovery">
                <p className="ms-rc-file-recovery-label">Recovery</p>
                <p className="ms-rc-file-line">
                  <span className="ms-rc-file-num">3</span> ranked on standby
                </p>
                <p className="ms-rc-file-line">Timed offer window opens 8:00 AM</p>
                <p className="ms-rc-file-line ms-rc-file-line--claim">No claim yet</p>
              </div>
              <div className="ms-rc-file-action ms-rc-file-action--quiet">
                <p className="ms-rc-file-foot">PulseFill holds the queue order until someone qualifies.</p>
                <p className="ms-rc-file-recover">
                  Est. recover <span className="ms-rc-file-money">$340</span>
                </p>
              </div>
            </div>
          </div>
        </article>
      </div>

      <article className="ms-rc-file ms-rc-file--compact" aria-label="Example standby offer case">
        <div className="ms-rc-file-inner">
          <div className="ms-rc-file-rail" aria-hidden />
          <div className="ms-rc-file-sheet">
            <header className="ms-rc-file-header">
              <span className="ms-rc-file-kicker">Standby offer</span>
              <span className="ms-rc-file-urgency">In window</span>
            </header>
            <div className="ms-rc-file-appointment">
              <h3 className="ms-rc-file-service">Dental cleaning</h3>
              <p className="ms-rc-file-when">Today · 2:30 PM</p>
              <p className="ms-rc-file-where">Yorkville Wellness</p>
            </div>
            <div className="ms-rc-file-recovery">
              <p className="ms-rc-file-recovery-label">Your place in line</p>
              <p className="ms-rc-file-line">
                Queue <span className="ms-rc-file-num">2</span> of <span className="ms-rc-file-num">9</span>
              </p>
              <p className="ms-rc-file-line">Window closes 2:18 PM</p>
              <p className="ms-rc-file-line ms-rc-file-line--claim">Offer matches your saved preferences</p>
            </div>
            <div className="ms-rc-file-action">
              <button type="button" className="ms-rc-file-cta">
                Claim slot
              </button>
              <p className="ms-rc-file-recover">
                Visit value <span className="ms-rc-file-money">$185</span>
              </p>
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}
