import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { createServiceSupabase } from "../../config/supabase.js";
import { sendJson } from "../../lib/http-errors.js";
import { requireAuth } from "../../plugins/guards.js";
import { rateLimitTier } from "../../plugins/rate-limit.js";
import {
  buildDirectoryDetailPayload,
  buildDirectoryListPayload,
  ensureCustomerRow,
  executeStandbyIntent,
} from "./customer-directory.service.js";

const directoryPrefixes = ["/v1/directory", "/v1/customers/directory"] as const;

export async function registerCustomerDirectoryRoutes(app: FastifyInstance) {
  for (const base of directoryPrefixes) {
    app.get(
      `${base}/businesses`,
      { preHandler: requireAuth, config: { rateLimit: rateLimitTier.directoryRead } },
      async (req, reply) => {
        const admin = createServiceSupabase(req.server.env);
        let customerId: string;
        try {
          customerId = (await ensureCustomerRow(admin, req.authUser!)).id;
        } catch {
          return sendJson(req, reply, 500, { error: "customer_sync_failed" });
        }
        try {
          const payload = await buildDirectoryListPayload(admin, customerId);
          return reply.send(payload);
        } catch (e) {
          req.log.error({ e }, "directory list failed");
          return sendJson(req, reply, 500, { error: "directory_list_failed" });
        }
      },
    );

    app.get<{ Params: { businessId: string } }>(
      `${base}/businesses/:businessId`,
      { preHandler: requireAuth, config: { rateLimit: rateLimitTier.directoryRead } },
      async (req, reply) => {
        const businessId = z.string().uuid().parse(req.params.businessId);
        const admin = createServiceSupabase(req.server.env);
        let customerId: string;
        try {
          customerId = (await ensureCustomerRow(admin, req.authUser!)).id;
        } catch {
          return sendJson(req, reply, 500, { error: "customer_sync_failed" });
        }

        const built = await buildDirectoryDetailPayload(admin, customerId, businessId);
        if (built.kind === "not_found") {
          return sendJson(req, reply, 404, { error: "not_found" });
        }
        return reply.send(built.body);
      },
    );

    app.post<{ Params: { businessId: string } }>(
      `${base}/businesses/:businessId/standby-intent`,
      { preHandler: requireAuth, config: { rateLimit: rateLimitTier.strict } },
      async (req, reply) => {
        const businessId = z.string().uuid().parse(req.params.businessId);
        return executeStandbyIntent(req, reply, businessId, req.body);
      },
    );

    app.post<{ Params: { businessId: string } }>(
      `${base}/businesses/:businessId/request-to-join`,
      { preHandler: requireAuth, config: { rateLimit: rateLimitTier.strict } },
      async (req, reply) => {
        const businessId = z.string().uuid().parse(req.params.businessId);
        return executeStandbyIntent(req, reply, businessId, req.body);
      },
    );
  }
}
