import type { FastifyInstance } from "fastify";
import Stripe from "stripe";

import type { Env } from "../../config/env.js";
import { createServiceSupabase } from "../../config/supabase.js";
import { sendJson, sendPublicError } from "../../lib/http-errors.js";
import { requireStaff } from "../../plugins/guards.js";
import { rateLimitTier } from "../../plugins/rate-limit.js";
import { stripeClientFromEnv } from "../billing/billing-stripe.js";
import { createConnectOnboardingLink, getConnectAccountSnapshot, refreshConnectAccountStatus } from "./payments-connect.js";

const CONNECT_ERROR_MESSAGE = "We couldn't open payout setup right now. Try again shortly.";

function mapConnectError(err: unknown): { status: number; error: string } {
  const msg = err instanceof Error ? err.message : String(err);
  if (msg === "connect_missing_dashboard_url") return { status: 503, error: "connect_unconfigured" };
  if (err instanceof Stripe.errors.StripeError) return { status: 502, error: "connect_session_failed" };
  return { status: 502, error: "connect_session_failed" };
}

export async function registerPaymentsRoutes(app: FastifyInstance) {
  if (!app.env.ENABLE_CONNECT_ROUTES) return;

  app.post(
    "/v1/payments/connect/onboarding-link",
    { preHandler: requireStaff, config: { rateLimit: rateLimitTier.staffAction } },
    async (req, reply) => {
      const env = req.server.env as Env;
      const stripe = stripeClientFromEnv(env);
      if (!stripe) return sendJson(req, reply, 503, { error: "connect_unconfigured" });

      const admin = createServiceSupabase(env);
      try {
        const { url } = await createConnectOnboardingLink({
          admin,
          stripe,
          env,
          businessId: req.staff!.business_id,
        });
        return reply.send({ url });
      } catch (e) {
        req.log.warn({ e }, "connect_onboarding_link_failed");
        const mapped = mapConnectError(e);
        return sendPublicError(req, reply, mapped.status, mapped.error, CONNECT_ERROR_MESSAGE);
      }
    },
  );

  app.get(
    "/v1/payments/connect/status",
    { preHandler: requireStaff, config: { rateLimit: rateLimitTier.directoryRead } },
    async (req, reply) => {
      const env = req.server.env as Env;
      const admin = createServiceSupabase(env);
      const forceRefresh = (req.query as { refresh?: string }).refresh === "1";

      try {
        if (!forceRefresh) {
          const snapshot = await getConnectAccountSnapshot(admin, req.staff!.business_id);
          return reply.send(snapshot);
        }
        const stripe = stripeClientFromEnv(env);
        if (!stripe) return sendJson(req, reply, 503, { error: "connect_unconfigured" });
        const snapshot = await refreshConnectAccountStatus({ admin, stripe, businessId: req.staff!.business_id });
        return reply.send(snapshot);
      } catch (e) {
        req.log.error({ e }, "connect_status_failed");
        return sendJson(req, reply, 500, { error: "connect_status_failed" });
      }
    },
  );
}
