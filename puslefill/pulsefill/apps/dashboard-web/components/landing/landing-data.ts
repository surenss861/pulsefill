export type PipelineStepEmphasis = "bookend" | "bridge" | "operator";

export type PipelineStep = {
  step: string;
  title: string;
  body: string;
  emphasis: PipelineStepEmphasis;
};

export const LANDING_PIPELINE_STEPS: PipelineStep[] = [
  {
    step: "1",
    title: "A slot opens",
    body: "The empty visit shows up with time, service, and value.",
    emphasis: "bookend",
  },
  {
    step: "2",
    title: "The waitlist is matched",
    body: "PulseFill ranks who should be offered first — not a blast to everyone.",
    emphasis: "bridge",
  },
  {
    step: "3",
    title: "Staff confirm the save",
    body: "Claims, reminders, and one confirmation tap back to the calendar.",
    emphasis: "operator",
  },
  {
    step: "4",
    title: "Recovery is visible",
    body: "Bookings and dollars attributed to real confirmations.",
    emphasis: "bookend",
  },
];
