import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { createServiceSupabase } from "../../config/supabase.js";
import type { Env } from "../../config/env.js";
import { sendJson } from "../../lib/http-errors.js";
import { requireCustomer, requireStaff } from "../../plugins/guards.js";
import { rateLimitTier } from "../../plugins/rate-limit.js";
import { getBillingSummary } from "./billing-summary.js";

const portalBody = z
  .object({
    return_url: z.string().url(),
  })
  .strict();

const checkoutBody = z
  .object({
    price_id: z.string().min(1),
    success_url: z.string().url(),
    cancel_url: z.string().url(),
  })
  .strict();

export async function registerBillingRoutes(app: FastifyInstance) {
  app.get(
    "/v1/billing/summary",
    { preHandler: requireStaff, config: { rateLimit: rateLimitTier.directoryRead } },
    async (req, reply) => {
      const admin = createServiceSupabase(req.server.env);
      const env = req.server.env as Env;
      try {
        const data = await getBillingSummary(admin, req.staff!.business_id, env);
        return reply.send(data);
      } catch (e) {
        req.log.error({ e }, "billing summary failed");
        return sendJson(req, reply, 500, { error: "billing_summary_failed" });
      }
    },
  );

  if (!app.env.ENABLE_BILLING_ROUTES) {
    return;
  }

  app.post(
    "/v1/billing/subscription-checkout",
    { preHandler: requireStaff },
    async (req, reply) => {
      if (!req.server.env.STRIPE_SECRET_KEY) {
        return sendJson(req, reply, 501, { error: "stripe_not_configured" });
      }
      checkoutBody.parse(req.body ?? {});
      return sendJson(req, reply, 501, {
        error: "stripe_checkout_not_implemented",
        hint: "Wire Stripe Checkout Session creation here using req.staff.business_id.",
      });
    },
  );

  app.post(
    "/v1/billing/customer-portal",
    { preHandler: requireStaff },
    async (req, reply) => {
      if (!req.server.env.STRIPE_SECRET_KEY) {
        return sendJson(req, reply, 501, { error: "stripe_not_configured" });
      }
      portalBody.parse(req.body ?? {});
      return sendJson(req, reply, 501, {
        error: "stripe_portal_not_implemented",
        hint: "Create a Stripe billing portal session for the business Stripe customer.",
      });
    },
  );

  app.post(
    "/v1/billing/setup-intent",
    { preHandler: requireCustomer },
    async (req, reply) => {
      if (!req.server.env.STRIPE_SECRET_KEY) {
        return sendJson(req, reply, 501, { error: "stripe_not_configured" });
      }
      void req.customer;
      void req.body;
      return sendJson(req, reply, 501, { error: "setup_intent_not_implemented" });
    },
  );

  app.post(
    "/v1/billing/deposit-intent",
    { preHandler: requireCustomer },
    async (req, reply) => {
      if (!req.server.env.STRIPE_SECRET_KEY) {
        return sendJson(req, reply, 501, { error: "stripe_not_configured" });
      }
      void req.customer;
      void req.body;
      return sendJson(req, reply, 501, { error: "deposit_intent_not_implemented" });
    },
  );
}
