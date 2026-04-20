import { apiFetch } from "@/lib/api";
import type { MorningRecoveryDigestResponse } from "@/types/morning-recovery-digest";

export async function getOperatorMorningRecoveryDigest(): Promise<MorningRecoveryDigestResponse> {
  return apiFetch<MorningRecoveryDigestResponse>("/v1/businesses/mine/morning-recovery-digest");
}
