import type { FastifyInstance } from "fastify";
import { enqueueExpireOffersSweep } from "../../lib/queue.js";
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
}
