import type { FastifyInstance } from "fastify";
import type { FastifyRequest } from "fastify";

import { createServiceSupabase } from "../../config/supabase.js";
import { sendJson } from "../../lib/http-errors.js";
import { createStripeClient } from "../billing/billing-stripe.js";
import { handleVerifiedStripeWebhook } from "../billing/billing-stripe-webhook.js";

export async function registerStripeWebhookRoutes(app: FastifyInstance) {
  await app.register(
    async (scope) => {
      scope.addContentTypeParser(
        "application/json",
        { parseAs: "buffer" },
        (req: FastifyRequest, body: Buffer, done) => {
          done(null, body);
        },
      );

      scope.post("/stripe", async (req, reply) => {
        const env = req.server.env;
        const whSecret = env.STRIPE_WEBHOOK_SECRET?.trim();
        if (!whSecret) {
          return sendJson(req, reply, 501, { error: "stripe_webhook_not_configured" });
        }

        const stripeKey = env.STRIPE_SECRET_KEY?.trim();
        if (!stripeKey) {
          return sendJson(req, reply, 501, { error: "stripe_not_configured" });
        }

        const sig = req.headers["stripe-signature"];
        if (typeof sig !== "string" || !sig.trim()) {
          return sendJson(req, reply, 400, { error: "stripe_webhook_missing_signature" });
        }

        const raw = req.body;
        if (!Buffer.isBuffer(raw)) {
          return sendJson(req, reply, 400, { error: "stripe_webhook_invalid_body" });
        }

        const stripe = createStripeClient(stripeKey);
        let event: import("stripe").Stripe.Event;
        try {
          event = stripe.webhooks.constructEvent(raw, sig, whSecret);
        } catch (err) {
          req.log.warn({ err }, "stripe webhook signature verification failed");
          return sendJson(req, reply, 400, { error: "stripe_webhook_invalid_signature" });
        }

        const admin = createServiceSupabase(env);
        try {
          await handleVerifiedStripeWebhook(admin, stripe, event);
        } catch (e) {
          req.log.error({ e, type: event.type }, "stripe webhook handler failed");
          return sendJson(req, reply, 500, { error: "stripe_webhook_handler_failed" });
        }

        return reply.send({ received: true });
      });
    },
    { prefix: "/v1/webhooks" },
  );
}
