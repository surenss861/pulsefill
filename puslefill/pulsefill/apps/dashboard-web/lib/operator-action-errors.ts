/** Maps API `error.code` from operator action endpoints to operator-facing copy. */
export function operatorActionMessageForCode(code: string | undefined, fallback: string): string {
  switch (code) {
    case "already_confirmed":
      return "Already confirmed.";
    case "claim_mismatch":
      return "That claim changed before confirmation. Refresh and review.";
    case "slot_not_claimed":
      return "This opening is no longer awaiting confirmation.";
    case "slot_terminal_state":
      return "This opening can no longer be confirmed.";
    case "slot_already_claimed":
      return "This opening already has a claimant.";
    case "slot_already_booked":
      return "This opening has already been confirmed.";
    case "slot_expired":
      return "This opening has expired.";
    case "slot_cancelled":
      return "This opening was cancelled.";
    case "forbidden":
      return "You don’t have access to do that.";
    case "not_found":
      return "This opening no longer exists.";
    case "invalid_request":
      return "That request wasn’t valid. Refresh and try again.";
    case "server_error":
      return "Something went wrong. Try again.";
    default:
      return fallback;
  }
}
