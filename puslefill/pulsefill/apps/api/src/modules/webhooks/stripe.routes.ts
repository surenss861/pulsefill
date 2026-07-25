import type { FastifyInstance } from "fastify";
import type { FastifyRequest } from "fastify";
import type { SupabaseClient } from "@supabase/supabase-js";

import { createServiceSupabase } from "../../config/supabase.js";
import { sendJson } from "../../lib/http-errors.js";
import { createStripeClient } from "../billing/billing-stripe.js";
import { handleVerifiedStripeWebhook } from "../billing/billing-stripe-webhook.js";
import { handleVerifiedPaymentsStripeWebhook } from "../payments/payments-webhook.js";

/**
 * Stripe delivers at-least-once; several payments handlers do stateful,
 * one-way transitions (capture/refund) rather than SaaS billing's re-fetch-
 * and-upsert style, so a duplicate delivery needs to be a true no-op.
 * Returns false (caller should skip dispatch) when this event id was already
 * recorded. Fails open (treats as first-delivery) on any error other than a
 * genuine duplicate-key conflict — dedup is a safety net, not a gate; a
 * transient/unreachable dedup table shouldn't block real webhook processing.
 */
async function claimStripeEventOnce(
  admin: SupabaseClient,
  event: import("stripe").Stripe.Event,
  log: FastifyRequest["log"],
): Promise<boolean> {
  try {
    const { error } = await admin
      .from("processed_stripe_events")
      .insert({ stripe_event_id: event.id, event_type: event.type });
    if (!error) return true;
    if (error.code === "23505") return false;
    log.warn({ error, type: event.type }, "processed_stripe_events_insert_failed");
    return true;
  } catch (e) {
    log.warn({ e, type: event.type }, "processed_stripe_events_insert_failed");
    return true;
  }
}

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

        const isFirstDelivery = await claimStripeEventOnce(admin, event, req.log);
        if (!isFirstDelivery) {
          return reply.send({ received: true, duplicate: true });
        }

        try {
          await handleVerifiedStripeWebhook(admin, stripe, event);
          await handleVerifiedPaymentsStripeWebhook(admin, event);
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
