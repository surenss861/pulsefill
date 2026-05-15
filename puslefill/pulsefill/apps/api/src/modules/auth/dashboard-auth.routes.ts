import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { createServiceSupabase } from "../../config/supabase.js";
import { assertMobileAuthRateLimit } from "../../lib/mobile-auth-rate-limit.js";
import { mapSupabaseAuthFailure } from "./supabase-auth-error-map.js";

const emailNormalized = z
  .string()
  .trim()
  .min(3)
  .max(254)
  .transform((s) => s.toLowerCase())
  .pipe(z.string().email());

const dashboardBusinessSignUpBody = z
  .object({
    email: emailNormalized,
    password: z.string().min(8).max(2048),
    full_name: z.string().trim().min(1).max(200),
    business_name: z.string().trim().min(1).max(200).optional(),
    device_id: z.string().trim().max(128).optional(),
  })
  .strict();

function brokerError(
  reply: FastifyReply,
  req: FastifyRequest,
  status: number,
  code: string,
  message: string,
  retryable: boolean,
) {
  return reply.status(status).send({
    error: {
      code,
      message,
      retryable,
      request_id: req.requestId,
    },
  });
}

/**
 * Dashboard operator signup: creates `auth.users` (unconfirmed by default). DB triggers create
 * `profiles` + operator workspace (`businesses` + `staff_users`). Does **not** create `customers`.
 */
export async function registerDashboardAuthRoutes(app: FastifyInstance) {
  app.post("/v1/dashboard/auth/sign-up-business", async (req, reply) => {
    const parsed = dashboardBusinessSignUpBody.safeParse(req.body ?? {});
    if (!parsed.success) {
      req.log.info({ auth_phase: "dashboard_sign_up_business", err: parsed.error.flatten() }, "dashboard_auth_validation_failed");
      return brokerError(reply, req, 400, "VALIDATION_ERROR", "Check your details and try again.", false);
    }

    const { email, password, full_name, business_name, device_id } = parsed.data;
    const env = req.server.env;

    if ((await assertMobileAuthRateLimit(env, "dashboard-sign-up-business", req, email, device_id)) === "limited") {
      req.log.warn({ auth_phase: "dashboard_sign_up_business", outcome: "rate_limited" }, "dashboard_auth_rate_limited");
      return brokerError(reply, req, 429, "RATE_LIMITED", "Too many attempts. Try again shortly.", true);
    }

    const admin = createServiceSupabase(env);
    const meta: Record<string, unknown> = {
      full_name,
      signup_intent: "business",
    };
    if (business_name) {
      meta.business_name = business_name;
    }

    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: false,
      user_metadata: meta,
    });

    if (error || !data.user) {
      const mapped = mapSupabaseAuthFailure(error ?? { message: "unknown" });
      req.log.info(
        {
          auth_phase: "dashboard_sign_up_business",
          status: mapped.status,
          code: mapped.code,
          supabase_code: error?.code,
        },
        "dashboard_sign_up_business_supabase_failed",
      );
      return brokerError(reply, req, mapped.status, mapped.code, mapped.message, mapped.retryable);
    }

    const session = (data as { session?: { access_token?: string } | null }).session;

    if (!session) {
      req.log.info(
        { auth_phase: "dashboard_sign_up_business", status: 200, needs_confirmation: true, user_id: data.user.id },
        "dashboard_sign_up_business_pending_confirmation",
      );
      return reply.send({
        needs_email_confirmation: true,
        email,
        request_id: req.requestId,
      });
    }

    req.log.info({ auth_phase: "dashboard_sign_up_business", status: 200, user_id: data.user.id }, "dashboard_sign_up_business_ok");
    return reply.send({
      needs_email_confirmation: false,
      request_id: req.requestId,
    });
  });
}
