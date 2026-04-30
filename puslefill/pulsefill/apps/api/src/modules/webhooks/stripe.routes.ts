import type { FastifyInstance } from "fastify";

export async function registerStripeWebhookRoutes(app: FastifyInstance) {
  app.post("/v1/webhooks/stripe", async (req, reply) => {
    if (!req.server.env.STRIPE_WEBHOOK_SECRET) {
      return reply.status(501).send({ error: "stripe_webhook_not_configured" });
    }

    req.log.warn(
      { hasSignature: Boolean(req.headers["stripe-signature"]) },
      "stripe webhook disabled until signed raw-body verification is wired",
    );
    return reply.status(501).send({ error: "stripe_webhook_not_enabled" });
  });
}
