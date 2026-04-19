import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { createServiceSupabase } from "../../config/supabase.js";
import { requireCustomer } from "../../plugins/guards.js";

const prefBody = z
  .object({
    business_id: z.string().uuid(),
    location_id: z.string().uuid().nullable().optional(),
    service_id: z.string().uuid().nullable().optional(),
    provider_id: z.string().uuid().nullable().optional(),
    max_notice_hours: z.number().int().positive().nullable().optional(),
    earliest_time: z.string().nullable().optional(),
    latest_time: z.string().nullable().optional(),
    days_of_week: z.array(z.number().int().min(0).max(6)).default([]),
    max_distance_km: z.number().int().positive().nullable().optional(),
    deposit_ok: z.boolean().optional(),
    active: z.boolean().optional(),
  })
  .strict();

const patchPref = prefBody.partial().omit({ business_id: true });

const pushDeviceBody = z
  .object({
    device_token: z.string().min(10),
    platform: z.literal("ios"),
    environment: z.enum(["development", "production"]).default("development"),
    app_build: z.string().max(64).optional(),
  })
  .strict();

function mapCustomerOfferRow(row: Record<string, unknown>) {
  const { open_slots: nestedSlot, ...rest } = row;
  const slot = nestedSlot;
  const openSlot = Array.isArray(slot) ? slot[0] ?? null : slot ?? null;
  return { ...rest, open_slot: openSlot };
}

export async function registerCustomerRoutes(app: FastifyInstance) {
  app.get(
    "/v1/customers/me",
    { preHandler: requireCustomer },
    async (req, reply) => {
      const admin = createServiceSupabase(req.server.env);
      const { data, error } = await admin.from("customers").select("*").eq("id", req.customer!.id).maybeSingle();
      if (error) return reply.status(500).send({ error: "load_failed" });
      return reply.send(data);
    },
  );

  app.get(
    "/v1/customers/me/business-services",
    { preHandler: requireCustomer },
    async (req, reply) => {
      const q = z
        .object({
          business_id: z.string().uuid(),
        })
        .parse((req.query as Record<string, string | undefined>) ?? {});

      const admin = createServiceSupabase(req.server.env);
      const { data: biz, error: bizErr } = await admin.from("businesses").select("id").eq("id", q.business_id).maybeSingle();
      if (bizErr) return reply.status(500).send({ error: "lookup_failed" });
      if (!biz) return reply.status(404).send({ error: "business_not_found" });

      const { data, error } = await admin
        .from("services")
        .select("id, name, duration_minutes, price_cents, active")
        .eq("business_id", q.business_id)
        .eq("active", true)
        .order("name", { ascending: true });

      if (error) return reply.status(500).send({ error: "list_failed" });
      return reply.send(data ?? []);
    },
  );

  app.get(
    "/v1/customers/me/standby-labels",
    { preHandler: requireCustomer },
    async (req, reply) => {
      const q = z
        .object({
          business_id: z.string().uuid(),
          service_id: z.string().uuid().optional(),
        })
        .parse((req.query as Record<string, string | undefined>) ?? {});

      const admin = createServiceSupabase(req.server.env);
      const { data: biz, error: bizErr } = await admin.from("businesses").select("id, name").eq("id", q.business_id).maybeSingle();
      if (bizErr) return reply.status(500).send({ error: "lookup_failed" });
      if (!biz) return reply.status(404).send({ error: "business_not_found" });

      let serviceName: string | null = null;
      if (q.service_id) {
        const { data: svc, error: svcErr } = await admin
          .from("services")
          .select("id, name")
          .eq("id", q.service_id)
          .eq("business_id", q.business_id)
          .maybeSingle();
        if (svcErr) return reply.status(500).send({ error: "lookup_failed" });
        serviceName = svc?.name ?? null;
      }

      return reply.send({
        business_name: biz.name,
        service_name: serviceName,
      });
    },
  );

  app.get(
    "/v1/customers/me/preferences",
    { preHandler: requireCustomer },
    async (req, reply) => {
      const admin = createServiceSupabase(req.server.env);
      const { data, error } = await admin
        .from("standby_preferences")
        .select("*")
        .eq("customer_id", req.customer!.id)
        .order("created_at", { ascending: false });

      if (error) return reply.status(500).send({ error: "list_failed" });
      return reply.send(data ?? []);
    },
  );

  app.post(
    "/v1/customers/me/preferences",
    { preHandler: requireCustomer },
    async (req, reply) => {
      const admin = createServiceSupabase(req.server.env);
      const body = prefBody.parse(req.body ?? {});

      const { data: biz } = await admin.from("businesses").select("id").eq("id", body.business_id).maybeSingle();
      if (!biz) return reply.status(400).send({ error: "invalid_business" });

      const { data, error } = await admin
        .from("standby_preferences")
        .insert({
          ...body,
          customer_id: req.customer!.id,
        })
        .select("*")
        .single();

      if (error) return reply.status(500).send({ error: "create_failed" });
      return reply.status(201).send(data);
    },
  );

  app.patch(
    "/v1/customers/me/preferences/:id",
    { preHandler: requireCustomer },
    async (req, reply) => {
      const admin = createServiceSupabase(req.server.env);
      const id = z.string().uuid().parse((req.params as { id?: string }).id);
      const body = patchPref.parse(req.body ?? {});

      const { data: existing } = await admin
        .from("standby_preferences")
        .select("id")
        .eq("id", id)
        .eq("customer_id", req.customer!.id)
        .maybeSingle();
      if (!existing) return reply.status(404).send({ error: "not_found" });

      const { data, error } = await admin
        .from("standby_preferences")
        .update({ ...body, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select("*")
        .single();

      if (error) return reply.status(500).send({ error: "update_failed" });
      return reply.send(data);
    },
  );

  app.delete(
    "/v1/customers/me/preferences/:id",
    { preHandler: requireCustomer },
    async (req, reply) => {
      const admin = createServiceSupabase(req.server.env);
      const id = z.string().uuid().parse((req.params as { id?: string }).id);

      const { error } = await admin
        .from("standby_preferences")
        .delete()
        .eq("id", id)
        .eq("customer_id", req.customer!.id);

      if (error) return reply.status(500).send({ error: "delete_failed" });
      return reply.status(204).send();
    },
  );

  app.get(
    "/v1/customers/me/offers",
    { preHandler: requireCustomer },
    async (req, reply) => {
      const admin = createServiceSupabase(req.server.env);
      const now = new Date().toISOString();

      const { data, error } = await admin
        .from("slot_offers")
        .select("*, open_slots(*)")
        .eq("customer_id", req.customer!.id)
        .in("status", ["sent", "delivered", "viewed"])
        .gt("expires_at", now)
        .order("sent_at", { ascending: false });

      if (error) return reply.status(500).send({ error: "list_failed" });
      const offers = (data ?? []).map((r) => mapCustomerOfferRow(r as Record<string, unknown>));
      return reply.send({ offers });
    },
  );

  app.post(
    "/v1/customers/me/push-devices",
    { preHandler: requireCustomer },
    async (req, reply) => {
      const admin = createServiceSupabase(req.server.env);
      const body = pushDeviceBody.parse(req.body ?? {});

      const { data, error } = await admin
        .from("customer_push_devices")
        .upsert(
          {
            customer_id: req.customer!.id,
            platform: body.platform,
            device_token: body.device_token,
            environment: body.environment,
            app_build: body.app_build ?? null,
            active: true,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "customer_id,device_token" },
        )
        .select("id")
        .single();

      if (error) {
        req.log.error({ error }, "push device upsert failed");
        return reply.status(500).send({ error: "register_failed" });
      }

      return reply.send({ registered: true, id: data.id });
    },
  );

  app.get(
    "/v1/customers/me/activity",
    { preHandler: requireCustomer },
    async (req, reply) => {
      const admin = createServiceSupabase(req.server.env);

      const { data, error } = await admin
        .from("slot_claims")
        .select(
          `
          id,
          open_slot_id,
          claimed_at,
          status,
          open_slots (
            id,
            provider_name_snapshot,
            starts_at,
            ends_at,
            estimated_value_cents,
            status
          )
        `,
        )
        .eq("customer_id", req.customer!.id)
        .order("claimed_at", { ascending: false });

      if (error) {
        req.log.error({ error }, "customer activity failed");
        return reply.status(500).send({ error: "activity_failed" });
      }

      const activity = (data ?? []).map((row: Record<string, unknown>) => {
        const { open_slots: nested, ...rest } = row;
        const openSlot = Array.isArray(nested) ? nested[0] ?? null : nested ?? null;
        return { ...rest, open_slot: openSlot };
      });

      return reply.send({ activity });
    },
  );
}
