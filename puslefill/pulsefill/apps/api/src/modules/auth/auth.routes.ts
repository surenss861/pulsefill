import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { createServiceSupabase } from "../../config/supabase.js";
import { sendJson } from "../../lib/http-errors.js";
import { requireAuth } from "../../plugins/guards.js";
import { buildAuthMePayload } from "./auth-context.js";

const syncBody = z
  .object({
    full_name: z.string().min(1).max(200).optional(),
    phone: z.string().min(5).max(40).optional(),
  })
  .strict();

export async function registerAuthRoutes(app: FastifyInstance) {
  app.get(
    "/v1/auth/me",
    { preHandler: requireAuth },
    async (req) => {
      const admin = createServiceSupabase(req.server.env);
      const u = req.authUser!;
      return buildAuthMePayload(
        admin,
        {
          id: u.id,
          email: u.email,
          app_metadata: u.app_metadata as Record<string, unknown>,
          user_metadata: u.user_metadata as Record<string, unknown>,
        },
        req.log,
      );
    },
  );

  app.post(
    "/v1/auth/session/sync",
    { preHandler: requireAuth },
    async (req, reply) => {
      const admin = createServiceSupabase(req.server.env);
      const body = syncBody.parse(req.body ?? {});
      const u = req.authUser!;

      const row = {
        auth_user_id: u.id,
        email: u.email ?? null,
        full_name: body.full_name ?? (u.user_metadata?.full_name as string | undefined) ?? null,
        phone: body.phone ?? null,
      };

      const { data, error } = await admin
        .from("customers")
        .upsert(row, { onConflict: "auth_user_id" })
        .select("id")
        .single();

      if (error) {
        req.log.error({ error }, "customer upsert failed");
        return sendJson(req, reply, 500, {
          error: "sync_failed",
          message: "We could not sync your profile. Try again in a moment.",
        });
      }

      return reply.send({ ok: true, synced: true, customer_id: data.id });
    },
  );
}
