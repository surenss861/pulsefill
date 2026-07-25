import { Queue } from "bullmq";
import type { Env } from "../config/env.js";

const DEFAULT_JOB_OPTIONS = {
  attempts: 3,
  backoff: { type: "exponential" as const, delay: 2000 },
};

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

export async function enqueueExpireOffersSweep(env: Env): Promise<{ queued: boolean }> {
  const q = getJobsQueue(env);
  if (!q) return { queued: false };
  await q.add("expire-offers", {}, { ...DEFAULT_JOB_OPTIONS, removeOnComplete: 200 });
  return { queued: true };
}

export async function enqueueReleaseStalePaymentAuthorizationsSweep(env: Env): Promise<{ queued: boolean }> {
  const q = getJobsQueue(env);
  if (!q) return { queued: false };
  await q.add("release-stale-payment-authorizations", {}, { ...DEFAULT_JOB_OPTIONS, removeOnComplete: 200 });
  return { queued: true };
}
