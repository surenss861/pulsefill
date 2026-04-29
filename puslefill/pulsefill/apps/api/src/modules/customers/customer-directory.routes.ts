import type { FastifyInstance } from "fastify";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { z } from "zod";
import { createServiceSupabase } from "../../config/supabase.js";
import { requireAuth } from "../../plugins/guards.js";
import { normalizeEmailForInvite } from "./invite-token.js";
import { upsertActiveCustomerMembership } from "./membership.js";

async function ensureCustomerRow(admin: SupabaseClient, u: User): Promise<{ id: string }> {
  const row = {
    auth_user_id: u.id,
    email: u.email != null ? normalizeEmailForInvite(u.email) : null,
    full_name: (u.user_metadata?.full_name as string | undefined) ?? null,
  };
  const { data, error } = await admin.from("customers").upsert(row, { onConflict: "auth_user_id" }).select("id").single();
  if (error || !data) {
    throw new Error("customer_upsert_failed");
  }
  return { id: (data as { id: string }).id };
}

const standbyIntentBody = z
  .object({
    message: z.string().max(500).optional(),
  })
  .strict();

export async function registerCustomerDirectoryRoutes(app: FastifyInstance) {
  app.get(
    "/v1/customers/directory/businesses",
    { preHandler: requireAuth },
    async (req, reply) => {
      const admin = createServiceSupabase(req.server.env);
      const { data, error } = await admin
        .from("businesses")
        .select("id, name, slug, category, timezone, standby_access_mode, customer_discovery_enabled")
        .eq("customer_discovery_enabled", true)
        .order("name", { ascending: true })
        .limit(100);

      if (error) {
        req.log.error({ error }, "directory list failed");
        return reply.status(500).send({ error: "directory_list_failed" });
      }
      return reply.send({ businesses: data ?? [] });
    },
  );

  app.get<{ Params: { businessId: string } }>(
    "/v1/customers/directory/businesses/:businessId",
    { preHandler: requireAuth },
    async (req, reply) => {
      const businessId = z.string().uuid().parse(req.params.businessId);
      const admin = createServiceSupabase(req.server.env);

      const { data: b, error: bErr } = await admin
        .from("businesses")
        .select("id, name, slug, category, timezone, phone, email, website, standby_access_mode, customer_discovery_enabled")
        .eq("id", businessId)
        .maybeSingle();

      if (bErr || !b) {
        return reply.status(404).send({ error: "not_found" });
      }
      if (!(b as { customer_discovery_enabled?: boolean }).customer_discovery_enabled) {
        return reply.status(404).send({ error: "not_found" });
      }

      const [{ data: locations }, { data: services }] = await Promise.all([
        admin.from("locations").select("id, name, city, region").eq("business_id", businessId).order("name"),
        admin.from("services").select("id, name, duration_minutes, active").eq("business_id", businessId).eq("active", true).order("name"),
      ]);

      return reply.send({
        business: b,
        locations: locations ?? [],
        services: services ?? [],
      });
    },
  );

  app.post<{ Params: { businessId: string } }>(
    "/v1/customers/directory/businesses/:businessId/standby-intent",
    { preHandler: requireAuth },
    async (req, reply) => {
      const businessId = z.string().uuid().parse(req.params.businessId);
      const body = standbyIntentBody.parse(req.body ?? {});
      const admin = createServiceSupabase(req.server.env);
      const u = req.authUser!;

      let customerId: string;
      try {
        customerId = (await ensureCustomerRow(admin, u)).id;
      } catch {
        return reply.status(500).send({ error: "customer_sync_failed" });
      }

      const { data: b, error: bErr } = await admin
        .from("businesses")
        .select("id, standby_access_mode, customer_discovery_enabled")
        .eq("id", businessId)
        .maybeSingle();

      if (bErr || !b) {
        return reply.status(404).send({ error: "not_found" });
      }
      const row = b as { id: string; standby_access_mode: string; customer_discovery_enabled: boolean };
      if (!row.customer_discovery_enabled) {
        return reply.status(404).send({ error: "not_found" });
      }

      const { data: existing } = await admin
        .from("customer_business_memberships")
        .select("id, status")
        .eq("customer_id", customerId)
        .eq("business_id", businessId)
        .maybeSingle();

      if (existing && (existing as { status: string }).status === "active") {
        return reply.send({ outcome: "already_connected" });
      }

      if (row.standby_access_mode === "private") {
        return reply
          .status(403)
          .send({
            error: "private_business",
            message: "This business only connects customers through an invite from the clinic.",
          });
      }

      if (row.standby_access_mode === "public") {
        try {
          await upsertActiveCustomerMembership(admin, customerId, businessId, "public");
        } catch (e) {
          req.log.error({ e }, "public membership upsert");
          return reply.status(500).send({ error: "membership_failed" });
        }
        return reply.status(201).send({ outcome: "joined_standby" });
      }

      // request_to_join
      const { data: inserted, error: insErr } = await admin
        .from("customer_standby_requests")
        .insert({
          business_id: businessId,
          customer_id: customerId,
          status: "pending",
          message: body.message ?? null,
        })
        .select("id, status, requested_at")
        .maybeSingle();

      if (insErr) {
        const code = String((insErr as { code?: string }).code ?? "");
        if (code === "23505") {
          return reply.send({ outcome: "request_pending" });
        }
        req.log.error({ error: insErr }, "standby request insert");
        return reply.status(500).send({ error: "request_failed" });
      }

      return reply.status(201).send({
        outcome: "request_submitted",
        request: inserted,
      });
    },
  );
}
