import { apiFetch } from "@/lib/api";
import type { OperatorActivityFeedResponse } from "@/types/operator-activity-feed";

export async function getOperatorActivityFeed(): Promise<OperatorActivityFeedResponse> {
  return apiFetch<OperatorActivityFeedResponse>("/v1/businesses/mine/activity-feed");
}
