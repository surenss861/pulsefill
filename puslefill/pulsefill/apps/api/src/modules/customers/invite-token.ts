import { createHash } from "node:crypto";

export function hashInviteToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export function normalizeEmailForInvite(email: string): string {
  return email.trim().toLowerCase();
}
