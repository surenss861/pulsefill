import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(3001),
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
    .default("info"),
  REDIS_URL: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  PUSH_PROVIDER: z.enum(["noop", "apns"]).default("noop"),
  APNS_TEAM_ID: z.string().optional(),
  APNS_KEY_ID: z.string().optional(),
  APNS_PRIVATE_KEY: z.string().optional(),
  APNS_BUNDLE_ID: z.string().optional(),
  APNS_ENVIRONMENT: z.enum(["sandbox", "production"]).default("sandbox"),
  /** Optional; used to build `invite_url` for POST /v1/customers/invites (e.g. https://customer.pulsefill.app) */
  CUSTOMER_APP_BASE_URL: z
    .union([z.string().url(), z.literal("")])
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined)),
});

export type Env = z.infer<typeof schema>;

export function loadEnv(): Env {
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    const msg = parsed.error.flatten().fieldErrors;
    throw new Error(`Invalid environment: ${JSON.stringify(msg)}`);
  }
  return parsed.data;
}
