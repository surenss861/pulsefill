export function RecoveryStepCard({
  step,
  title,
  body,
  active = false,
}: {
  step?: string;
  title: string;
  body: string;
  active?: boolean;
}) {
  return (
    <article className={["ms-rc-step", active ? "ms-rc-step--active" : ""].filter(Boolean).join(" ")}>
      {step != null && step !== "" ? (
        <span className="ms-rc-step-badge" aria-hidden>
          {step}
        </span>
      ) : null}
      <div className="ms-rc-step-body">
        <h3 className="ms-rc-step-title">{title}</h3>
        <p className="ms-rc-step-text">{body}</p>
      </div>
    </article>
  );
}
