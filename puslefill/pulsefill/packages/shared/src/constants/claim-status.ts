export const CLAIM_STATUSES = ["pending", "won", "lost", "confirmed", "failed"] as const;

export type ClaimStatus = (typeof CLAIM_STATUSES)[number];
