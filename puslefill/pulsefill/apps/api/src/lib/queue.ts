import { Queue } from "bullmq";
import type { Env } from "../config/env.js";
import type { SendOfferNotificationJobPayload } from "../modules/notifications/notifications.types.js";

let jobsQueue: Queue | null | undefined;

export function getJobsQueue(env: Env): Queue | null {
  if (!env.REDIS_URL) return null;
  if (jobsQueue === undefined) {
    jobsQueue = new Queue("pulsefill-jobs", {
      connection: { url: env.REDIS_URL },
    });
  }
  return jobsQueue;
}

export async function enqueueSendOfferNotificationJobs(
  env: Env,
  jobs: SendOfferNotificationJobPayload[],
): Promise<{ queued: boolean; count: number }> {
  const q = getJobsQueue(env);
  if (!q || jobs.length === 0) return { queued: false, count: 0 };
  for (const payload of jobs) {
    await q.add("send-offer-notification", payload, { removeOnComplete: 500 });
  }
  return { queued: true, count: jobs.length };
}

export async function enqueueExpireOffersSweep(env: Env): Promise<{ queued: boolean }> {
  const q = getJobsQueue(env);
  if (!q) return { queued: false };
  await q.add("expire-offers", {}, { removeOnComplete: 200 });
  return { queued: true };
}
