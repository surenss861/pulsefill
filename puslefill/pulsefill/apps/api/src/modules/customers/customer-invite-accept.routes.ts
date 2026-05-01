import type { FastifyInstance, FastifyRequest } from "fastify";
import { z } from "zod";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { createServiceSupabase } from "../../config/supabase.js";
import { sendJson } from "../../lib/http-errors.js";
import { requireAuth } from "../../plugins/guards.js";
import { rateLimitTier } from "../../plugins/rate-limit.js";
import { hashInviteToken, normalizeEmailForInvite } from "./invite-token.js";
import { upsertActiveCustomerMembership } from "./membership.js";

const acceptBody = z.object({ token: z.string().min(20) }).strict();

type CustomerInviteRow = {
  id: string;
  business_id: string;
  email: string;
  status: string;
  expires_at: string;
  accepted_by_customer_id: string | null;
};

function errPayload(req: FastifyRequest, code: string, message: string) {
  return { error: { code, message }, request_id: req.requestId };
}

async function upsertCustomerForUser(admin: SupabaseClient, u: User): Promise<{ id: string }> {
  const row = {
    auth_user_id: u.id,
    email: u.email != null ? normalizeEmailForInvite(u.email) : null,
    full_name: (u.user_metadata?.full_name as string | undefined) ?? null,
  };
  const { data, error } = await admin
    .from("customers")
    .upsert(row, { onConflict: "auth_user_id" })
    .select("id")
    .single();
  if (error || !data) {
    throw new Error("customer_upsert_failed");
  }
  return { id: (data as { id: string }).id };
}

async function ensureDefaultNotificationPreferences(admin: SupabaseClient, customerId: string): Promise<void> {
  const { error } = await admin.from("customer_notification_preferences").insert({ customer_id: customerId });
  if (error) {
    const code = String((error as { code?: string }).code ?? "");
    if (code === "23505" || String(error.message ?? "").toLowerCase().includes("duplicate")) return;
    throw error;
  }
}

async function countStandbyForBusiness(
  admin: SupabaseClient,
  customerId: string,
  businessId: string,
): Promise<number> {
  const { count, error } = await admin
    .from("standby_preferences")
    .select("id", { count: "exact", head: true })
    .eq("customer_id", customerId)
    .eq("business_id", businessId);
  if (error) return 0;
  return count ?? 0;
}

export async function registerCustomerInviteAcceptRoute(app: FastifyInstance) {
  app.post(
    "/v1/customers/invites/accept",
    { preHandler: requireAuth, config: { rateLimit: rateLimitTier.strict } },
    async (req, reply) => {
      const u = req.authUser!;
      const userEmail = u.email != null ? normalizeEmailForInvite(u.email) : null;
      if (!userEmail) {
        return reply.status(400).send(errPayload(req, "email_required", "Add an email to your account to accept an invite."));
      }

      const body = acceptBody.parse(req.body ?? {});
      const tokenHash = hashInviteToken(body.token);
      const admin = createServiceSupabase(req.server.env);
      const now = new Date().toISOString();

      const { data: invite, error: invErr } = await admin
        .from("customer_invites")
        .select("id, business_id, email, status, expires_at, accepted_by_customer_id")
        .eq("token_hash", tokenHash)
        .maybeSingle();

      if (invErr) {
        req.log.error({ error: invErr }, "invite lookup by token");
        return sendJson(req, reply, 500, { error: "lookup_failed" });
      }

      if (!invite) {
        return reply
          .status(404)
          .send(errPayload(req, "invite_not_found", "This invite link is not valid. Ask the business for a new invite."));
      }

      const row = invite as CustomerInviteRow;
      if (row.status === "pending" && new Date(row.expires_at) < new Date()) {
        await admin
          .from("customer_invites")
          .update({ status: "expired" })
          .eq("id", row.id)
          .eq("status", "pending");
        return reply
          .status(410)
          .send(errPayload(req, "invite_expired", "This invite has expired. Ask the business to send a new one."));
      }

      if (row.status !== "pending" && row.status !== "accepted") {
        if (row.status === "expired" || row.status === "revoked") {
          return reply
            .status(410)
            .send(errPayload(req, "invite_not_valid", "This invite is no longer available."));
        }
        return reply.status(410).send(errPayload(req, "invite_not_valid", "This invite is no longer available."));
      }

      if (userEmail !== normalizeEmailForInvite(row.email)) {
        return reply
          .status(403)
          .send(
            errPayload(
              req,
              "invite_email_mismatch",
              "This invite was sent to a different email. Sign in with the invited email or ask the clinic for a new invite.",
            ),
          );
      }

      let customer: { id: string };
      try {
        customer = await upsertCustomerForUser(admin, u);
      } catch {
        return sendJson(req, reply, 500, { error: "customer_sync_failed" });
      }

      if (row.status === "accepted") {
        if (row.accepted_by_customer_id === customer.id) {
          try {
            await upsertActiveCustomerMembership(admin, customer.id, row.business_id, "invite");
          } catch (e) {
            req.log.error({ e }, "membership upsert after idempotent accept");
            return sendJson(req, reply, 500, { error: "membership_sync_failed" });
          }
          try {
            await ensureDefaultNotificationPreferences(admin, customer.id);
          } catch (e) {
            req.log.warn({ e }, "notification preferences after idempotent accept");
          }
          const n = await countStandbyForBusiness(admin, customer.id, row.business_id);
          return reply.send({
            accepted: true,
            business_id: row.business_id,
            customer_id: customer.id,
            needs_standby_setup: n === 0,
          });
        }
        return reply
          .status(409)
          .send(
            errPayload(req, "invite_already_used", "This invite was already used by a different sign-in. Ask the business for a new invite if this was a mistake."),
          );
      }

      const { data: updated, error: upErr } = await admin
        .from("customer_invites")
        .update({
          status: "accepted",
          accepted_at: now,
          accepted_by_customer_id: customer.id,
        })
        .eq("id", row.id)
        .eq("status", "pending")
        .select("id")
        .maybeSingle();

      if (upErr) {
        req.log.error({ error: upErr }, "invite accept update");
        return sendJson(req, reply, 500, { error: "accept_failed" });
      }

      if (!updated) {
        const { data: reread } = await admin
          .from("customer_invites")
          .select("id, business_id, email, status, accepted_by_customer_id")
          .eq("id", row.id)
          .maybeSingle();
        const r = reread as CustomerInviteRow | null;
        if (r?.status === "accepted" && r.accepted_by_customer_id === customer.id) {
          try {
            await ensureDefaultNotificationPreferences(admin, customer.id);
          } catch (e) {
            req.log.warn({ e }, "notification prefs");
          }
          const n = await countStandbyForBusiness(admin, customer.id, r.business_id);
          return reply.send({
            accepted: true,
            business_id: r.business_id,
            customer_id: customer.id,
            needs_standby_setup: n === 0,
          });
        }
        return reply
          .status(409)
          .send(errPayload(req, "invite_already_used", "This invite was just accepted. Try again if it was you."));
      }

      try {
        await upsertActiveCustomerMembership(admin, customer.id, row.business_id, "invite");
      } catch (e) {
        req.log.error({ e }, "membership upsert on accept");
        return sendJson(req, reply, 500, { error: "membership_sync_failed" });
      }

      try {
        await ensureDefaultNotificationPreferences(admin, customer.id);
      } catch (e) {
        req.log.error({ e }, "notification preferences insert");
        return sendJson(req, reply, 500, { error: "notification_prefs_failed" });
      }

      const n = await countStandbyForBusiness(admin, customer.id, row.business_id);
      return reply.status(201).send({
        accepted: true,
        business_id: row.business_id,
        customer_id: customer.id,
        needs_standby_setup: n === 0,
      });
    },
  );
}
