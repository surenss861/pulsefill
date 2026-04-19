import type { FastifyInstance } from "fastify";
import { enqueueExpireOffersSweep } from "../../lib/queue.js";
import { requireStaff } from "../../plugins/guards.js";

export async function registerMaintenanceRoutes(app: FastifyInstance) {
  app.post(
    "/v1/maintenance/expire-offers",
    { preHandler: requireStaff },
    async (_req, reply) => {
      const queued = await enqueueExpireOffersSweep(_req.server.env);
      return reply.send({ ok: true, queued: queued.queued });
    },
  );
}
