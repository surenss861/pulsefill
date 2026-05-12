import { RecoveryStepCard } from "./recovery-step-card";

const STEPS: { step: string; title: string; body: string; active?: boolean }[] = [
  {
    step: "1",
    title: "Capture the opening",
    body: "When a patient cancels, the empty slot lands in PulseFill with time, service, and value — no retyping.",
  },
  {
    step: "2",
    title: "Match the waitlist",
    body: "Preferences and reach decide who is considered first. It is a ranked queue, not a blast to everyone on file.",
  },
  {
    step: "3",
    title: "Send timed offers",
    body: "Offers go out in a controlled window. You see who was contacted and who still needs a nudge.",
  },
  {
    step: "4",
    title: "Lock the claim",
    body: "The first qualified claim owns the slot so two patients cannot hold the same chair.",
    active: true,
  },
  {
    step: "5",
    title: "Confirm at the desk",
    body: "One confirmation tap ties the booking back to your calendar and closes the recovery.",
  },
];

export function RecoveryWorkflowSteps() {
  return (
    <div className="ms-rc-workflow">
      {STEPS.map((s) => (
        <RecoveryStepCard key={s.step} step={s.step} title={s.title} body={s.body} active={s.active} />
      ))}
    </div>
  );
}
