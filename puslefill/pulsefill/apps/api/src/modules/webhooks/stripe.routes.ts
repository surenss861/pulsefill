import type { FastifyInstance } from "fastify";
import { sendJson } from "../../lib/http-errors.js";

export async function registerStripeWebhookRoutes(app: FastifyInstance) {
  app.post("/v1/webhooks/stripe", async (req, reply) => {
    if (!req.server.env.STRIPE_WEBHOOK_SECRET) {
      return sendJson(req, reply, 501, { error: "stripe_webhook_not_configured" });
    }

    req.log.warn(
      { hasSignature: Boolean(req.headers["stripe-signature"]) },
      "stripe webhook disabled until signed raw-body verification is wired",
    );
    return sendJson(req, reply, 501, { error: "stripe_webhook_not_enabled" });
  });
}
