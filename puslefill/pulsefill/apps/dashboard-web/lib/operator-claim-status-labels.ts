import type { OperatorStatusKind } from "@/components/operator/operator-status-chip";

function normalizeClaimStatus(raw: string): string {
  return raw.trim().toLowerCase().replace(/-/g, "_");
}

/** Staff-safe label for `winning_claim.status` — never returns snake_case. */
export function operatorClaimStatusLabel(status: string | null | undefined): string {
  if (status == null || status.trim() === "") {
    return "Status unavailable";
  }
  const key = normalizeClaimStatus(status);
  const map: Record<string, string> = {
    pending_confirmation: "Waiting for confirmation",
    awaiting_confirmation: "Waiting for confirmation",
    confirmed: "Confirmed",
    lost: "Taken by another customer",
    expired: "Expired",
    unavailable: "No longer available",
    cancelled: "Cancelled",
    unknown: "Status unavailable",
    /** Common API / legacy drift */
    pending: "Waiting for confirmation",
    active: "Waiting for confirmation",
    won: "Selected for this opening",
    released: "Released",
    superseded: "Taken by another customer",
  };
  return map[key] ?? "Status unavailable";
}

/** Visual emphasis for claim status chips on the claims board. */
export function operatorClaimStatusKind(status: string | null | undefined): OperatorStatusKind {
  if (status == null || status.trim() === "") {
    return "inactive";
  }
  const key = normalizeClaimStatus(status);
  const attention: OperatorStatusKind = "attention";
  const confirmed: OperatorStatusKind = "confirmed";
  const quiet: OperatorStatusKind = "inactive";

  if (key === "pending_confirmation" || key === "awaiting_confirmation" || key === "pending") {
    return attention;
  }
  if (key === "confirmed") {
    return confirmed;
  }
  if (key === "won" || key === "active") {
    return attention;
  }
  if (key === "expired") return "expired";
  if (key === "cancelled" || key === "released") return "cancelled";
  if (key === "lost" || key === "superseded" || key === "unavailable" || key === "unknown") {
    return quiet;
  }
  return quiet;
}
