import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { createServiceSupabase } from "../../config/supabase.js";
import { requireStaff } from "../../plugins/guards.js";

const createBody = z
  .object({
    name: z.string().min(1).max(200),
    duration_minutes: z.number().int().min(5).max(24 * 60).optional(),
    price_cents: z.number().int().min(0).nullable().optional(),
    deposit_required: z.boolean().optional(),
    deposit_cents: z.number().int().min(0).nullable().optional(),
    active: z.boolean().optional(),
  })
  .strict();

const patchBody = createBody.partial();

export async function registerServiceRoutes(app: FastifyInstance) {
  app.get(
    "/v1/services",
    { preHandler: requireStaff },
    async (req, reply) => {
      const admin = createServiceSupabase(req.server.env);
      const { data, error } = await admin
        .from("services")
        .select("*")
        .eq("business_id", req.staff!.business_id)
        .order("created_at", { ascending: true });

      if (error) return reply.status(500).send({ error: "list_failed" });
      return reply.send(data ?? []);
    },
  );

  app.post(
    "/v1/services",
    { preHandler: requireStaff },
    async (req, reply) => {
      const admin = createServiceSupabase(req.server.env);
      const body = createBody.parse(req.body ?? {});

      const { data, error } = await admin
        .from("services")
        .insert({ ...body, business_id: req.staff!.business_id })
        .select("*")
        .single();

      if (error) return reply.status(500).send({ error: "create_failed" });
      return reply.status(201).send(data);
    },
  );

  app.patch(
    "/v1/services/:id",
    { preHandler: requireStaff },
    async (req, reply) => {
      const admin = createServiceSupabase(req.server.env);
      const id = z.string().uuid().parse((req.params as { id?: string }).id);
      const body = patchBody.parse(req.body ?? {});

      const { data: existing } = await admin
        .from("services")
        .select("id")
        .eq("id", id)
        .eq("business_id", req.staff!.business_id)
        .maybeSingle();
      if (!existing) return reply.status(404).send({ error: "not_found" });

      const { data, error } = await admin.from("services").update(body).eq("id", id).select("*").single();
      if (error) return reply.status(500).send({ error: "update_failed" });
      return reply.send(data);
    },
  );

  app.delete(
    "/v1/services/:id",
    { preHandler: requireStaff },
    async (req, reply) => {
      const admin = createServiceSupabase(req.server.env);
      const id = z.string().uuid().parse((req.params as { id?: string }).id);

      const { error } = await admin
        .from("services")
        .delete()
        .eq("id", id)
        .eq("business_id", req.staff!.business_id);

      if (error) return reply.status(500).send({ error: "delete_failed" });
      return reply.status(204).send();
    },
  );
}
