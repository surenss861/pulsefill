export type ClaimOutcomeState =
  | "pending_confirmation"
  | "confirmed"
  | "unavailable"
  | "lost"
  | "expired"
  | "unknown";

export type ClaimOutcomeNextStep = { code: string; title: string };

export function buildClaimOutcomePayload(args: {
  state: ClaimOutcomeState;
  businessName?: string | null;
  serviceName?: string | null;
}): { title: string; detail: string | null; next_steps: ClaimOutcomeNextStep[] } {
  const clinic = args.businessName?.trim() || "Clinic";
  const svc = args.serviceName?.trim() || "this opening";

  switch (args.state) {
    case "confirmed":
      return {
        title: "Your booking is confirmed",
        detail: `${clinic} confirmed this opening. You’re all set for the scheduled time.`,
        next_steps: [
          { code: "arrive_on_time", title: "Arrive on time for your appointment" },
          { code: "contact_clinic_if_needed", title: "Contact the clinic if you need to make changes" },
        ],
      };
    case "pending_confirmation":
      return {
        title: "You claimed this opening",
        detail: "The clinic still needs to confirm the booking. You’ll see an update here once that happens.",
        next_steps: [{ code: "wait_for_confirmation", title: "Wait for clinic confirmation" }],
      };
    case "lost":
      return {
        title: "Another customer claimed this opening",
        detail: "This slot was filled before your claim could win.",
        next_steps: [{ code: "keep_standby_on", title: "Keep standby on for the next opening" }],
      };
    case "unavailable":
      return {
        title: "Opening no longer available",
        detail: `${clinic} · ${svc} is no longer available to book this way.`,
        next_steps: [{ code: "check_activity", title: "Check Activity for other updates" }],
      };
    case "expired":
      return {
        title: "This opening expired",
        detail: "The time window passed before this could be confirmed for you.",
        next_steps: [{ code: "keep_standby_on", title: "Keep standby on for the next opening" }],
      };
    default:
      return {
        title: "Claim status",
        detail: "We’ll show the latest information here as it updates.",
        next_steps: [],
      };
  }
}
