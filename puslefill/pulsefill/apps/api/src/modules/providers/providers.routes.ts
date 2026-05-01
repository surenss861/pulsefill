import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { createServiceSupabase } from "../../config/supabase.js";
import { sendJson } from "../../lib/http-errors.js";
import { requireStaff } from "../../plugins/guards.js";

const createBody = z
  .object({
    name: z.string().min(1).max(200),
    location_id: z.string().uuid().nullable().optional(),
    provider_type: z.string().max(120).optional(),
    active: z.boolean().optional(),
  })
  .strict();

const patchBody = createBody.partial();

export async function registerProviderRoutes(app: FastifyInstance) {
  app.get(
    "/v1/providers",
    { preHandler: requireStaff },
    async (req, reply) => {
      const admin = createServiceSupabase(req.server.env);
      const { data, error } = await admin
        .from("providers")
        .select("*")
        .eq("business_id", req.staff!.business_id)
        .order("created_at", { ascending: true });

      if (error) return sendJson(req, reply, 500, { error: "list_failed" });
      return reply.send(data ?? []);
    },
  );

  app.post(
    "/v1/providers",
    { preHandler: requireStaff },
    async (req, reply) => {
      const admin = createServiceSupabase(req.server.env);
      const body = createBody.parse(req.body ?? {});

      if (body.location_id) {
        const { data: loc } = await admin
          .from("locations")
          .select("id")
          .eq("id", body.location_id)
          .eq("business_id", req.staff!.business_id)
          .maybeSingle();
        if (!loc) return sendJson(req, reply, 400, { error: "invalid_location" });
      }

      const { data, error } = await admin
        .from("providers")
        .insert({ ...body, business_id: req.staff!.business_id })
        .select("*")
        .single();

      if (error) return sendJson(req, reply, 500, { error: "create_failed" });
      return reply.status(201).send(data);
    },
  );

  app.patch(
    "/v1/providers/:id",
    { preHandler: requireStaff },
    async (req, reply) => {
      const admin = createServiceSupabase(req.server.env);
      const id = z.string().uuid().parse((req.params as { id?: string }).id);
      const body = patchBody.parse(req.body ?? {});

      if (body.location_id) {
        const { data: loc } = await admin
          .from("locations")
          .select("id")
          .eq("id", body.location_id)
          .eq("business_id", req.staff!.business_id)
          .maybeSingle();
        if (!loc) return sendJson(req, reply, 400, { error: "invalid_location" });
      }

      const { data: existing } = await admin
        .from("providers")
        .select("id")
        .eq("id", id)
        .eq("business_id", req.staff!.business_id)
        .maybeSingle();
      if (!existing) return sendJson(req, reply, 404, { error: "not_found" });

      const { data, error } = await admin.from("providers").update(body).eq("id", id).select("*").single();
      if (error) return sendJson(req, reply, 500, { error: "update_failed" });
      return reply.send(data);
    },
  );

  app.delete(
    "/v1/providers/:id",
    { preHandler: requireStaff },
    async (req, reply) => {
      const admin = createServiceSupabase(req.server.env);
      const id = z.string().uuid().parse((req.params as { id?: string }).id);

      const { error } = await admin
        .from("providers")
        .delete()
        .eq("id", id)
        .eq("business_id", req.staff!.business_id);

      if (error) return sendJson(req, reply, 500, { error: "delete_failed" });
      return reply.status(204).send();
    },
  );
}
