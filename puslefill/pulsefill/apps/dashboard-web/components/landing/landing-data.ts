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
    body: "Risk on the clock.",
    emphasis: "bookend",
  },
  {
    step: "2",
    title: "Standby demand is matched",
    body: "Right customers surfaced.",
    emphasis: "bridge",
  },
  {
    step: "3",
    title: "Operators are guided",
    body: "Queue, confirm, follow up — with context.",
    emphasis: "operator",
  },
  {
    step: "4",
    title: "Recovery becomes visible",
    body: "Bookings and revenue where teams work.",
    emphasis: "bookend",
  },
];
