import { randomBytes } from "node:crypto";
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { createServiceSupabase } from "../../config/supabase.js";
import { requireStaff } from "../../plugins/guards.js";
import type { Env } from "../../config/env.js";
import { hashInviteToken, normalizeEmailForInvite } from "./invite-token.js";

const postBody = z.object({ email: z.string().email() }).strict();

function buildInviteUrl(base: string | undefined, token: string): string | null {
  if (!base?.trim()) return null;
  const b = base.replace(/\/$/, "");
  return `${b}/invite?token=${encodeURIComponent(token)}`;
}

export async function registerStaffCustomerInviteRoutes(app: FastifyInstance) {
  app.get(
    "/v1/customers/invites",
    { preHandler: requireStaff },
    async (req, reply) => {
      const admin = createServiceSupabase(req.server.env);
      const { data, error } = await admin
        .from("customer_invites")
        .select("id, email, status, expires_at, created_at, accepted_at")
        .eq("business_id", req.staff!.business_id)
        .order("created_at", { ascending: false });
      if (error) {
        req.log.error({ error }, "list customer_invites failed");
        return reply.status(500).send({ error: "list_failed" });
      }
      return reply.send({ invites: data ?? [] });
    },
  );

  app.post(
    "/v1/customers/invites",
    { preHandler: requireStaff },
    async (req, reply) => {
      const admin = createServiceSupabase(req.server.env);
      const body = postBody.parse(req.body ?? {});
      const emailNorm = normalizeEmailForInvite(body.email);
      const env = req.server.env as Env;
      const ttlMs = 7 * 24 * 60 * 60 * 1000;
      const expires_at = new Date(Date.now() + ttlMs).toISOString();

      await admin
        .from("customer_invites")
        .update({ status: "expired" })
        .eq("business_id", req.staff!.business_id)
        .eq("email", emailNorm)
        .eq("status", "pending")
        .lt("expires_at", new Date().toISOString());

      const token = randomBytes(32).toString("base64url");
      const token_hash = hashInviteToken(token);

      const { data, error } = await admin
        .from("customer_invites")
        .insert({
          business_id: req.staff!.business_id,
          email: emailNorm,
          token_hash,
          status: "pending",
          expires_at,
          created_by_staff_id: req.staff!.id,
        })
        .select("id, email, status, expires_at, created_at, accepted_at")
        .single();

      if (error) {
        const code = String((error as { code?: string }).code ?? "");
        const message = String((error as { message?: string }).message ?? "").toLowerCase();
        if (code === "23505" || message.includes("duplicate key")) {
          return reply
            .status(409)
            .send({ error: "duplicate_pending_invite", message: "A pending invite already exists for this email." });
        }
        req.log.error({ error }, "create customer_invite failed");
        return reply.status(500).send({ error: "create_failed" });
      }

      const invite_url = buildInviteUrl(env.CUSTOMER_APP_BASE_URL, token);
      return reply.status(201).send({
        ...data,
        invite_url,
        one_time_token: token,
        expires_in_days: 7,
      });
    },
  );
}
