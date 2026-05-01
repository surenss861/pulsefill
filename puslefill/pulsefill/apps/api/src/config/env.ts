import { z } from "zod";

function parseCsvOrigins(raw: string | undefined, ctx: z.RefinementCtx): string[] | undefined {
  if (!raw?.trim()) return undefined;

  const origins = raw
    .split(",")
    .map((origin) => origin.trim().replace(/\/$/, ""))
    .filter(Boolean);

  for (const origin of origins) {
    try {
      const url = new URL(origin);
      if (url.origin !== origin) throw new Error("Origin must not include a path");
    } catch {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Invalid API_CORS_ORIGINS origin: ${origin}`,
      });
      return z.NEVER;
    }
  }

  return origins.length > 0 ? origins : undefined;
}

const featureFlag = z
  .string()
  .optional()
  .transform((value) => ["1", "true", "yes", "on"].includes(value?.trim().toLowerCase() ?? ""));

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(3001),
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
    .default("info"),
  API_CORS_ORIGINS: z.string().optional().transform(parseCsvOrigins),
  REDIS_URL: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  ENABLE_BILLING_ROUTES: featureFlag,
  ENABLE_STRIPE_WEBHOOK_ROUTES: featureFlag,
  /** When true, skips registering @fastify/rate-limit (used by API route tests). */
  RATE_LIMIT_DISABLED: z.preprocess(
    (val) => {
      if (val === undefined || val === "") return false;
      return ["1", "true", "yes", "on"].includes(String(val).trim().toLowerCase());
    },
    z.boolean(),
  ),
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
