import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { createServiceSupabase } from "../../config/supabase.js";
import { requireCustomer } from "../../plugins/guards.js";
import { fetchCustomerActivityFeed } from "./activity-feed.js";
import { fetchCustomerClaimStatus } from "./claim-status.js";
import { fetchMissedOpportunities } from "./missed-opportunities.js";
import {
  getCustomerNotificationPreferences,
  patchCustomerNotificationPreferences,
} from "./notification-preferences.js";
import { fetchCustomerOfferDetail } from "./offer-detail.js";
import { fetchCustomerStandbyStatus } from "./standby-status.js";

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
    token_type: z.enum(["apns", "expo"]).default("apns"),
    environment: z.enum(["development", "production"]).default("development"),
    app_build: z.string().max(64).optional(),
    replace_existing: z.boolean().default(true),
  })
  .strict();

const deactivatePushDeviceBody = z
  .object({
    device_token: z.string().min(10),
    platform: z.literal("ios").optional(),
    token_type: z.enum(["apns", "expo"]).optional(),
  })
  .strict();

type RegisterPushDeviceRow = {
  id: string;
  token_type: "apns" | "expo";
  replace_existing: boolean;
  last_seen_at: string;
};

type RegisterPushDeviceTestDelegateArgs = {
  customerId: string;
  body: z.infer<typeof pushDeviceBody>;
};

type DeactivatePushDeviceTestDelegateArgs = {
  customerId: string;
  body: z.infer<typeof deactivatePushDeviceBody>;
};

let registerPushDeviceTestDelegate:
  | null
  | ((args: RegisterPushDeviceTestDelegateArgs) => Promise<RegisterPushDeviceRow>) = null;
let deactivatePushDeviceTestDelegate:
  | null
  | ((args: DeactivatePushDeviceTestDelegateArgs) => Promise<{ deactivated: boolean; device_token: string }>) = null;

export function setRegisterPushDeviceTestDelegate(
  delegate: ((args: RegisterPushDeviceTestDelegateArgs) => Promise<RegisterPushDeviceRow>) | null,
) {
  registerPushDeviceTestDelegate = delegate;
}

export function setDeactivatePushDeviceTestDelegate(
  delegate: ((args: DeactivatePushDeviceTestDelegateArgs) => Promise<{ deactivated: boolean; device_token: string }>) | null,
) {
  deactivatePushDeviceTestDelegate = delegate;
}

export function resetCustomerPushDeviceTestDelegates() {
  registerPushDeviceTestDelegate = null;
  deactivatePushDeviceTestDelegate = null;
}

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

  app.get(
    "/v1/customers/me/offers/:offerId",
    { preHandler: requireCustomer },
    async (req, reply) => {
      const offerId = z.string().uuid().parse((req.params as { offerId?: string }).offerId);
      const admin = createServiceSupabase(req.server.env);
      const out = await fetchCustomerOfferDetail(admin, req.customer!.id, offerId);
      if (!out.ok) return reply.status(out.status).send({ error: out.error });
      return reply.send(out.body);
    },
  );

  app.get(
    "/v1/customers/me/claims/:claimId/status",
    { preHandler: requireCustomer },
    async (req, reply) => {
      const claimId = z.string().uuid().parse((req.params as { claimId?: string }).claimId);
      const admin = createServiceSupabase(req.server.env);
      const out = await fetchCustomerClaimStatus(admin, req.customer!.id, claimId);
      if (!out.ok) return reply.status(out.status).send({ error: out.error });
      return reply.send(out.body);
    },
  );

  app.get(
    "/v1/customers/me/activity-feed",
    { preHandler: requireCustomer },
    async (req, reply) => {
      const q = z
        .object({
          push_permission_status: z
            .enum(["authorized", "denied", "not_determined", "unknown"])
            .optional()
            .default("unknown"),
        })
        .parse((req.query as Record<string, string | undefined>) ?? {});

      const admin = createServiceSupabase(req.server.env);
      const out = await fetchCustomerActivityFeed(admin, req.customer!.id, {
        pushPermissionStatus: q.push_permission_status,
      });
      if ("error" in out) {
        req.log.error({ error: out.error }, "activity feed failed");
        return reply.status(500).send({ error: out.error });
      }
      return reply.send({ items: out.items });
    },
  );

  app.get(
    "/v1/customers/me/missed-opportunities",
    { preHandler: requireCustomer },
    async (req, reply) => {
      const admin = createServiceSupabase(req.server.env);
      try {
        const body = await fetchMissedOpportunities(admin, req.customer!.id);
        return reply.send(body);
      } catch (e) {
        req.log.error({ err: e }, "missed opportunities failed");
        return reply.status(500).send({ error: "missed_opportunities_failed" });
      }
    },
  );

  const notificationPrefsPatch = z
    .object({
      quiet_hours_enabled: z.boolean(),
      quiet_hours_start_local: z.string().nullable().optional(),
      quiet_hours_end_local: z.string().nullable().optional(),
      cadence_preference: z.enum(["all_opportunities", "best_matches", "important_only"]),
      notify_new_offers: z.boolean(),
      notify_claim_updates: z.boolean(),
      notify_booking_confirmations: z.boolean(),
      notify_standby_tips: z.boolean(),
    })
    .strict();

  app.get(
    "/v1/customers/me/notification-preferences",
    { preHandler: requireCustomer },
    async (req, reply) => {
      const q = z
        .object({
          push_permission_status: z
            .enum(["authorized", "denied", "not_determined", "unknown"])
            .default("unknown"),
        })
        .parse((req.query as Record<string, string | undefined>) ?? {});

      const admin = createServiceSupabase(req.server.env);
      const body = await getCustomerNotificationPreferences(admin, req.customer!.id, q.push_permission_status);
      return reply.send(body);
    },
  );

  app.patch(
    "/v1/customers/me/notification-preferences",
    { preHandler: requireCustomer },
    async (req, reply) => {
      const q = z
        .object({
          push_permission_status: z
            .enum(["authorized", "denied", "not_determined", "unknown"])
            .default("unknown"),
        })
        .parse((req.query as Record<string, string | undefined>) ?? {});

      const admin = createServiceSupabase(req.server.env);
      const parsed = notificationPrefsPatch.safeParse(req.body ?? {});
      if (!parsed.success) {
        return reply.status(400).send({ error: "invalid_body" });
      }
      const out = await patchCustomerNotificationPreferences(
        admin,
        req.customer!.id,
        parsed.data as Record<string, unknown>,
        q.push_permission_status,
      );
      if ("error" in out) {
        return reply.status((out as { status: number }).status).send({ error: (out as { error: string }).error });
      }
      return reply.send(out);
    },
  );

  app.post(
    "/v1/customers/me/push-devices",
    { preHandler: requireCustomer },
    async (req, reply) => {
      const admin = createServiceSupabase(req.server.env);
      const parsed = pushDeviceBody.safeParse(req.body ?? {});
      if (!parsed.success) {
        return reply.status(400).send({ error: "invalid_body" });
      }
      const body = parsed.data;
      const nowIso = new Date().toISOString();

      if (registerPushDeviceTestDelegate) {
        const row = await registerPushDeviceTestDelegate({
          customerId: req.customer!.id,
          body,
        });
        return reply.send({
          registered: true,
          id: row.id,
          token_type: row.token_type,
          replaced_existing: row.replace_existing,
          last_seen_at: row.last_seen_at,
        });
      }

      const { data, error } = await admin
        .from("customer_push_devices")
        .upsert(
          {
            customer_id: req.customer!.id,
            platform: body.platform,
            token_type: body.token_type,
            device_token: body.device_token,
            environment: body.environment,
            app_build: body.app_build ?? null,
            active: true,
            last_seen_at: nowIso,
            updated_at: nowIso,
          },
          { onConflict: "customer_id,device_token" },
        )
        .select("id")
        .single();

      if (error) {
        req.log.error({ error }, "push device upsert failed");
        return reply.status(500).send({ error: "register_failed" });
      }

      if (body.replace_existing) {
        const { error: deactivationError } = await admin
          .from("customer_push_devices")
          .update({
            active: false,
            updated_at: nowIso,
          })
          .eq("customer_id", req.customer!.id)
          .eq("platform", body.platform)
          .eq("token_type", body.token_type)
          .neq("device_token", body.device_token)
          .eq("active", true);
        if (deactivationError) {
          req.log.error({ deactivationError }, "push device replacement deactivate failed");
          return reply.status(500).send({ error: "register_failed" });
        }
      }

      return reply.send({
        registered: true,
        id: data.id,
        token_type: body.token_type,
        replaced_existing: body.replace_existing,
        last_seen_at: nowIso,
      });
    },
  );

  app.post(
    "/v1/customers/me/push-devices/deactivate",
    { preHandler: requireCustomer },
    async (req, reply) => {
      const admin = createServiceSupabase(req.server.env);
      const parsed = deactivatePushDeviceBody.safeParse(req.body ?? {});
      if (!parsed.success) {
        return reply.status(400).send({ error: "invalid_body" });
      }
      const body = parsed.data;
      const nowIso = new Date().toISOString();

      if (deactivatePushDeviceTestDelegate) {
        const out = await deactivatePushDeviceTestDelegate({
          customerId: req.customer!.id,
          body,
        });
        return reply.send(out);
      }

      let update = admin
        .from("customer_push_devices")
        .update({
          active: false,
          updated_at: nowIso,
        })
        .eq("customer_id", req.customer!.id)
        .eq("device_token", body.device_token)
        .eq("active", true);

      if (body.platform) {
        update = update.eq("platform", body.platform);
      }
      if (body.token_type) {
        update = update.eq("token_type", body.token_type);
      }

      const { error } = await update;
      if (error) {
        req.log.error({ error }, "push device deactivate failed");
        return reply.status(500).send({ error: "deactivate_failed" });
      }

      return reply.send({
        deactivated: true,
        device_token: body.device_token,
      });
    },
  );

  app.get(
    "/v1/customers/me/standby-status",
    { preHandler: requireCustomer },
    async (req, reply) => {
      const q = z
        .object({
          push_permission_status: z.enum(["authorized", "denied", "not_determined", "unknown"]).optional(),
        })
        .parse((req.query as Record<string, string | undefined>) ?? {});

      const admin = createServiceSupabase(req.server.env);
      try {
        const body = await fetchCustomerStandbyStatus(admin, req.customer!.id, {
          pushPermissionStatus: q.push_permission_status ?? "unknown",
        });
        return reply.send(body);
      } catch (e) {
        req.log.error({ err: e }, "standby status failed");
        return reply.status(500).send({ error: "standby_status_failed" });
      }
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
