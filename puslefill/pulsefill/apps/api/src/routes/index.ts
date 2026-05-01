import type { FastifyInstance } from "fastify";
import { createServiceSupabase } from "../config/supabase.js";
import { sendJson } from "../lib/http-errors.js";
import { registerAuthRoutes } from "../modules/auth/auth.routes.js";
import { registerBillingRoutes } from "../modules/billing/billing.routes.js";
import { registerBusinessRoutes } from "../modules/businesses/businesses.routes.js";
import { registerCustomerRoutes } from "../modules/customers/customers.routes.js";
import { registerCustomerInviteAcceptRoute } from "../modules/customers/customer-invite-accept.routes.js";
import { registerCustomerDirectoryRoutes } from "../modules/customers/customer-directory.routes.js";
import { registerStaffCustomerInviteRoutes } from "../modules/customers/staff-customer-invites.routes.js";
import { registerStaffCustomerStandbyRequestsRoutes } from "../modules/customers/staff-customer-standby-requests.routes.js";
import { registerLocationRoutes } from "../modules/locations/locations.routes.js";
import { registerMaintenanceRoutes } from "../modules/maintenance/maintenance.routes.js";
import { registerOpenSlotRoutes } from "../modules/slots/open-slots.routes.js";
import { registerProviderRoutes } from "../modules/providers/providers.routes.js";
import { registerServiceRoutes } from "../modules/services/services.routes.js";
import { registerStripeWebhookRoutes } from "../modules/webhooks/stripe.routes.js";

export async function registerRoutes(app: FastifyInstance) {
  app.get("/health", async () => ({ ok: true }));

  /** Liveness vs readiness: verifies service-role DB connectivity (no auth). */
  app.get("/ready", async (req, reply) => {
    const admin = createServiceSupabase(req.server.env);
    const { error } = await admin.from("businesses").select("id").limit(1);
    if (error) {
      req.log.warn({ err: error }, "readiness database check failed");
      return sendJson(req, reply, 503, {
        ready: false,
        checks: { database: "error" },
      });
    }
    return reply.send({
      ready: true,
      checks: { database: "ok" },
    });
  });

  await registerAuthRoutes(app);
  await registerBusinessRoutes(app);
  await registerLocationRoutes(app);
  await registerProviderRoutes(app);
  await registerServiceRoutes(app);
  await registerCustomerRoutes(app);
  await registerCustomerInviteAcceptRoute(app);
  await registerCustomerDirectoryRoutes(app);
  await registerStaffCustomerInviteRoutes(app);
  await registerStaffCustomerStandbyRequestsRoutes(app);
  await registerOpenSlotRoutes(app);
  await registerMaintenanceRoutes(app);
  if (app.env.ENABLE_BILLING_ROUTES) {
    await registerBillingRoutes(app);
  }
  if (app.env.ENABLE_STRIPE_WEBHOOK_ROUTES) {
    await registerStripeWebhookRoutes(app);
  }
}
