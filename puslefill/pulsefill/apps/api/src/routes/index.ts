import type { FastifyInstance } from "fastify";
import { registerAuthRoutes } from "../modules/auth/auth.routes.js";
import { registerBillingRoutes } from "../modules/billing/billing.routes.js";
import { registerBusinessRoutes } from "../modules/businesses/businesses.routes.js";
import { registerCustomerRoutes } from "../modules/customers/customers.routes.js";
import { registerLocationRoutes } from "../modules/locations/locations.routes.js";
import { registerMaintenanceRoutes } from "../modules/maintenance/maintenance.routes.js";
import { registerOpenSlotRoutes } from "../modules/slots/open-slots.routes.js";
import { registerProviderRoutes } from "../modules/providers/providers.routes.js";
import { registerServiceRoutes } from "../modules/services/services.routes.js";
import { registerStripeWebhookRoutes } from "../modules/webhooks/stripe.routes.js";

export async function registerRoutes(app: FastifyInstance) {
  app.get("/health", async () => ({ ok: true }));

  await registerAuthRoutes(app);
  await registerBusinessRoutes(app);
  await registerLocationRoutes(app);
  await registerProviderRoutes(app);
  await registerServiceRoutes(app);
  await registerCustomerRoutes(app);
  await registerOpenSlotRoutes(app);
  await registerMaintenanceRoutes(app);
  await registerBillingRoutes(app);
  await registerStripeWebhookRoutes(app);
}
