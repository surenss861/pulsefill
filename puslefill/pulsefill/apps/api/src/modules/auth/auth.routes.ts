import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { createServiceSupabase } from "../../config/supabase.js";
import { requireAuth } from "../../plugins/guards.js";

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
    async (req) => ({
      user: {
        id: req.authUser!.id,
        email: req.authUser!.email,
        app_metadata: req.authUser!.app_metadata,
        user_metadata: req.authUser!.user_metadata,
      },
    }),
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
        return reply.status(500).send({ error: "sync_failed" });
      }

      return reply.send({ ok: true, synced: true, customer_id: data.id });
    },
  );
}
