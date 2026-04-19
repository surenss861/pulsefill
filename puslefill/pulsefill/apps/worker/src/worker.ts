import "dotenv/config";
import { Worker } from "bullmq";
import { Redis } from "ioredis";
import { createWorkerSupabase } from "./lib/supabase.js";
import { expireOffersJob } from "./jobs/expire-offers.job.js";
import {
  sendOfferNotificationJob,
  type SendOfferNotificationJobPayload,
} from "./jobs/send-offer-notification.job.js";

const redisUrl = process.env.REDIS_URL;
if (!redisUrl) {
  console.error("REDIS_URL is required for the worker process.");
  process.exit(1);
}

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for the worker process.");
  process.exit(1);
}

const supabase = createWorkerSupabase(supabaseUrl, supabaseServiceRoleKey);

const connection = new Redis(redisUrl, { maxRetriesPerRequest: null });

const worker = new Worker(
  "pulsefill-jobs",
  async (job) => {
    if (job.name === "send-offer-notification") {
      const payload = job.data as SendOfferNotificationJobPayload;
      return await sendOfferNotificationJob(supabase, payload);
    }

    if (job.name === "expire-offers") {
      return await expireOffersJob(supabase);
    }

    console.log("[pulsefill-jobs] unknown job", job.name, job.data);
    return { ok: false };
  },
  { connection },
);

worker.on("failed", (job, err) => {
  console.error("[pulsefill-jobs] job failed", job?.id, err);
});

console.log("PulseFill worker listening on queue pulsefill-jobs");
