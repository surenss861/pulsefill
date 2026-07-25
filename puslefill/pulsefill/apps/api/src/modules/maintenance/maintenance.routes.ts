import type { FastifyInstance } from "fastify";
import { enqueueExpireOffersSweep, enqueueReleaseStalePaymentAuthorizationsSweep } from "../../lib/queue.js";
import { requireStaff } from "../../plugins/guards.js";
import { rateLimitTier } from "../../plugins/rate-limit.js";

export async function registerMaintenanceRoutes(app: FastifyInstance) {
  app.post(
    "/v1/maintenance/expire-offers",
    { preHandler: requireStaff, config: { rateLimit: rateLimitTier.staffAction } },
    async (_req, reply) => {
      const queued = await enqueueExpireOffersSweep(_req.server.env);
      return reply.send({ ok: true, queued: queued.queued });
    },
  );

  // Run after expire-offers in the same cron cadence: this sweep depends on
  // slots already being marked expired/cancelled.
  app.post(
    "/v1/maintenance/release-stale-payment-authorizations",
    { preHandler: requireStaff, config: { rateLimit: rateLimitTier.staffAction } },
    async (_req, reply) => {
      const queued = await enqueueReleaseStalePaymentAuthorizationsSweep(_req.server.env);
      return reply.send({ ok: true, queued: queued.queued });
    },
  );
}
