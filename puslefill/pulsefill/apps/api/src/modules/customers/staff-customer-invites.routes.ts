import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { createServiceSupabase } from "../../config/supabase.js";
import type { Env } from "../../config/env.js";
import { sendJson } from "../../lib/http-errors.js";
import { requireStaff } from "../../plugins/guards.js";
import { rateLimitTier } from "../../plugins/rate-limit.js";
import {
  createStaffCustomerInvite,
  listStaffCustomerInvites,
  revokeStaffCustomerInvite,
} from "./staff-customer-invites.service.js";

const postBody = z
  .object({
    email: z.string().email(),
    customer_name: z.string().max(160).optional(),
  })
  .strict();

function staffInvitePaths(): string[] {
  return ["/v1/customers/invites", "/v1/businesses/mine/customer-invites"];
}

export async function registerStaffCustomerInviteRoutes(app: FastifyInstance) {
  for (const base of staffInvitePaths()) {
    app.get(
      base,
      { preHandler: requireStaff, config: { rateLimit: rateLimitTier.directoryRead } },
      async (req, reply) => {
        const admin = createServiceSupabase(req.server.env);
        const env = req.server.env as Env;
        try {
          const data = await listStaffCustomerInvites(admin, req.staff!.business_id, env);
          return reply.send(data);
        } catch (e) {
          req.log.error({ e }, "list customer_invites failed");
          return sendJson(req, reply, 500, { error: "list_failed" });
        }
      },
    );

    app.post(
      base,
      { preHandler: requireStaff, config: { rateLimit: rateLimitTier.staffAction } },
      async (req, reply) => {
        const admin = createServiceSupabase(req.server.env);
        const env = req.server.env as Env;
        let parsed: z.infer<typeof postBody>;
        try {
          parsed = postBody.parse(req.body ?? {});
        } catch {
          return sendJson(req, reply, 400, { error: "validation_error", message: "Invalid request body." });
        }

        try {
          const displayName =
            parsed.customer_name != null && String(parsed.customer_name).trim().length > 0
              ? String(parsed.customer_name).trim()
              : null;
          const data = await createStaffCustomerInvite(
            admin,
            req.staff!.business_id,
            req.staff!.id,
            parsed.email,
            displayName,
            env,
          );
          return reply.status(201).send(data);
        } catch (err) {
          if (err instanceof Error && err.message === "duplicate_pending_invite") {
            return sendJson(req, reply, 409, {
              error: "duplicate_pending_invite",
              message: "A pending invite already exists for this email.",
            });
          }
          req.log.error({ err }, "create customer_invite failed");
          return sendJson(req, reply, 500, { error: "create_failed" });
        }
      },
    );
  }

  const revokeSuffix = "/:inviteId/revoke";

  for (const base of staffInvitePaths()) {
    app.post(
      `${base}${revokeSuffix}`,
      { preHandler: requireStaff, config: { rateLimit: rateLimitTier.staffAction } },
      async (req, reply) => {
        const admin = createServiceSupabase(req.server.env);
        const env = req.server.env as Env;
        const idParsed = z.string().uuid().safeParse((req.params as { inviteId?: string }).inviteId);
        if (!idParsed.success) {
          return sendJson(req, reply, 400, { error: "invalid_invite_id" });
        }
        try {
          const updated = await revokeStaffCustomerInvite(admin, req.staff!.business_id, idParsed.data, env);
          if (!updated) {
            return sendJson(req, reply, 404, { error: "not_found" });
          }
          return reply.send({ invite: updated });
        } catch (e) {
          req.log.error({ e }, "revoke customer_invite failed");
          return sendJson(req, reply, 500, { error: "revoke_failed" });
        }
      },
    );
  }
}
