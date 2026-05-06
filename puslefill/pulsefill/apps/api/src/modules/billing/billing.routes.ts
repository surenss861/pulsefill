import type { FastifyInstance } from "fastify";
import Stripe from "stripe";

import { createServiceSupabase } from "../../config/supabase.js";
import type { Env } from "../../config/env.js";
import { sendJson } from "../../lib/http-errors.js";
import { sendPublicError } from "../../lib/http-errors.js";
import { requireCustomer, requireStaff } from "../../plugins/guards.js";
import { rateLimitTier } from "../../plugins/rate-limit.js";
import { getBillingSummary } from "./billing-summary.js";
import { stripeClientFromEnv } from "./billing-stripe.js";
import { createBillingCheckoutSession, createBillingPortalSession } from "./billing-stripe-sessions.js";

const BILLING_SESSION_USER_MESSAGE = "We couldn't open billing right now. Try again shortly.";

function mapBillingSessionError(err: unknown): { status: number; error: string } {
  const msg = err instanceof Error ? err.message : String(err);
  if (msg === "billing_missing_price_id" || msg === "billing_missing_dashboard_url") {
    return { status: 503, error: "billing_checkout_unconfigured" };
  }
  if (msg === "billing_portal_missing_customer") {
    return { status: 400, error: "billing_portal_no_customer" };
  }
  if (msg === "billing_checkout_missing_url" || msg === "billing_portal_missing_url") {
    return { status: 502, error: "billing_session_failed" };
  }
  if (err instanceof Stripe.errors.StripeError) {
    return { status: 502, error: "billing_session_failed" };
  }
  return { status: 502, error: "billing_session_failed" };
}

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
    "/v1/billing/checkout",
    { preHandler: requireStaff, config: { rateLimit: rateLimitTier.staffAction } },
    async (req, reply) => {
      const env = req.server.env as Env;
      const stripe = stripeClientFromEnv(env);
      if (!stripe) {
        return sendJson(req, reply, 503, { error: "billing_checkout_unconfigured" });
      }
      if (!env.STRIPE_SUBSCRIPTION_PRICE_ID?.trim() || !env.DASHBOARD_URL?.trim()) {
        return sendJson(req, reply, 503, { error: "billing_checkout_unconfigured" });
      }

      const admin = createServiceSupabase(env);
      try {
        const { url } = await createBillingCheckoutSession({
          admin,
          stripe,
          env,
          businessId: req.staff!.business_id,
        });
        return reply.send({ url });
      } catch (e) {
        req.log.warn({ e }, "billing checkout session failed");
        const mapped = mapBillingSessionError(e);
        return sendPublicError(req, reply, mapped.status, mapped.error, BILLING_SESSION_USER_MESSAGE);
      }
    },
  );

  app.post(
    "/v1/billing/portal",
    { preHandler: requireStaff, config: { rateLimit: rateLimitTier.staffAction } },
    async (req, reply) => {
      const env = req.server.env as Env;
      const stripe = stripeClientFromEnv(env);
      if (!stripe) {
        return sendJson(req, reply, 503, { error: "billing_portal_unconfigured" });
      }
      if (!env.DASHBOARD_URL?.trim()) {
        return sendJson(req, reply, 503, { error: "billing_portal_unconfigured" });
      }

      const admin = createServiceSupabase(env);
      try {
        const { url } = await createBillingPortalSession({
          admin,
          stripe,
          env,
          businessId: req.staff!.business_id,
        });
        return reply.send({ url });
      } catch (e) {
        req.log.warn({ e }, "billing portal session failed");
        const mapped = mapBillingSessionError(e);
        return sendPublicError(req, reply, mapped.status, mapped.error, BILLING_SESSION_USER_MESSAGE);
      }
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
