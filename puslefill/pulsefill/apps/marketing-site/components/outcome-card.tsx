export function OutcomeCard({
  value,
  label,
  hint,
  valueTone = "success",
}: {
  value: string;
  label: string;
  hint?: string;
  valueTone?: "success" | "default";
}) {
  return (
    <article className="ms-rc-outcome">
      <p className={valueTone === "success" ? "ms-rc-outcome-value" : "ms-rc-outcome-value ms-rc-outcome-value--muted"}>
        {value}
      </p>
      <p className="ms-rc-outcome-label">{label}</p>
      {hint ? <p className="ms-rc-outcome-hint">{hint}</p> : null}
    </article>
  );
}
