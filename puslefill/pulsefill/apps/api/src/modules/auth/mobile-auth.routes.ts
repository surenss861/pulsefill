import { createHash } from "node:crypto";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { createServiceSupabase, createUserPasswordSupabase } from "../../config/supabase.js";
import { assertMobileAuthRateLimit } from "../../lib/mobile-auth-rate-limit.js";
import { buildAuthMePayload } from "./auth-context.js";
import { mapSupabaseAuthFailure } from "./supabase-auth-error-map.js";

const emailNormalized = z
  .string()
  .trim()
  .min(3)
  .max(254)
  .transform((s) => s.toLowerCase())
  .pipe(z.string().email());

const signInBody = z
  .object({
    email: emailNormalized,
    password: z.string().min(1).max(2048),
    device_id: z.string().trim().max(128).optional(),
  })
  .strict();

const signUpBody = z
  .object({
    email: emailNormalized,
    password: z.string().min(6).max(2048),
    full_name: z.string().trim().min(1).max(200).optional(),
    device_id: z.string().trim().max(128).optional(),
  })
  .strict();

const passwordResetBody = z
  .object({
    email: emailNormalized,
    device_id: z.string().trim().max(128).optional(),
  })
  .strict();

const refreshBody = z
  .object({
    refresh_token: z.string().min(1).max(8192),
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

async function upsertCustomerForSession(
  admin: ReturnType<typeof createServiceSupabase>,
  authUser: { id: string; email?: string | null; user_metadata?: Record<string, unknown> },
  overrides?: { full_name?: string | null; phone?: string | null },
): Promise<{ ok: true; customerId: string } | { ok: false }> {
  const row = {
    auth_user_id: authUser.id,
    email: authUser.email ?? null,
    full_name:
      overrides?.full_name ??
      (authUser.user_metadata?.full_name as string | undefined) ??
      null,
    phone: overrides?.phone ?? null,
  };

  const { data, error } = await admin.from("customers").upsert(row, { onConflict: "auth_user_id" }).select("id").single();

  if (error || !data?.id) {
    return { ok: false };
  }
  return { ok: true, customerId: data.id as string };
}

async function successPayload(
  req: FastifyRequest,
  admin: ReturnType<typeof createServiceSupabase>,
  session: { access_token: string; refresh_token?: string | null },
  authUser: { id: string; email?: string | null; app_metadata?: Record<string, unknown>; user_metadata?: Record<string, unknown> },
) {
  const me = await buildAuthMePayload(
    admin,
    {
      id: authUser.id,
      email: authUser.email,
      app_metadata: authUser.app_metadata,
      user_metadata: authUser.user_metadata,
    },
    req.log,
  );

  return {
    session: {
      access_token: session.access_token,
      refresh_token: session.refresh_token ?? null,
      user_id: authUser.id,
      email: authUser.email ?? null,
    },
    user: me.user,
    roles: me.roles,
    customer: me.customer,
    staff: me.staff,
    allowed_surfaces: me.allowed_surfaces,
    default_surface: me.default_surface,
    request_id: req.requestId,
  };
}

export async function registerMobileAuthRoutes(app: FastifyInstance) {
  app.post("/v1/mobile/auth/sign-in", async (req, reply) => {
    const parsed = signInBody.safeParse(req.body ?? {});
    if (!parsed.success) {
      req.log.info({ auth_phase: "mobile_sign_in", err: parsed.error.flatten() }, "mobile_auth_validation_failed");
      return brokerError(reply, req, 400, "VALIDATION_ERROR", "Check your email and password and try again.", false);
    }
    const { email, password, device_id } = parsed.data;
    const env = req.server.env;

    if ((await assertMobileAuthRateLimit(env, "sign-in", req, email, device_id)) === "limited") {
      req.log.warn({ auth_phase: "mobile_sign_in", outcome: "rate_limited" }, "mobile_auth_rate_limited");
      return brokerError(reply, req, 429, "RATE_LIMITED", "Too many attempts. Try again shortly.", true);
    }

    const userSb = createUserPasswordSupabase(env);
    const { data, error } = await userSb.auth.signInWithPassword({ email, password });

    if (error || !data.session || !data.user) {
      const mapped = mapSupabaseAuthFailure(error ?? { message: "unknown" });
      req.log.info(
        { auth_phase: "mobile_sign_in", status: mapped.status, code: mapped.code, supabase_code: error?.code },
        "mobile_sign_in_supabase_failed",
      );
      return brokerError(reply, req, mapped.status, mapped.code, mapped.message, mapped.retryable);
    }

    const admin = createServiceSupabase(env);

    req.log.info({ auth_phase: "mobile_sign_in", status: 200, user_id: data.user.id }, "mobile_sign_in_ok");
    return reply.send(
      await successPayload(req, admin, { access_token: data.session.access_token, refresh_token: data.session.refresh_token }, data.user),
    );
  });

  async function handleMobileCustomerSignUp(req: FastifyRequest, reply: FastifyReply) {
    const parsed = signUpBody.safeParse(req.body ?? {});
    if (!parsed.success) {
      req.log.info({ auth_phase: "mobile_sign_up_customer", err: parsed.error.flatten() }, "mobile_auth_validation_failed");
      return brokerError(reply, req, 400, "VALIDATION_ERROR", "Check your email and password and try again.", false);
    }
    const { email, password, full_name, device_id } = parsed.data;
    const env = req.server.env;

    if ((await assertMobileAuthRateLimit(env, "sign-up", req, email, device_id)) === "limited") {
      req.log.warn({ auth_phase: "mobile_sign_up_customer", outcome: "rate_limited" }, "mobile_auth_rate_limited");
      return brokerError(reply, req, 429, "RATE_LIMITED", "Too many attempts. Try again shortly.", true);
    }

    const userSb = createUserPasswordSupabase(env);
    const userData: Record<string, string> = { signup_intent: "customer" };
    if (full_name) {
      userData.full_name = full_name;
    }
    const { data, error } = await userSb.auth.signUp({
      email,
      password,
      options: { data: userData },
    });

    if (error) {
      const mapped = mapSupabaseAuthFailure(error);
      req.log.info(
        { auth_phase: "mobile_sign_up_customer", status: mapped.status, code: mapped.code, supabase_code: error.code },
        "mobile_sign_up_customer_supabase_failed",
      );
      return brokerError(reply, req, mapped.status, mapped.code, mapped.message, mapped.retryable);
    }

    if (!data.session || !data.user) {
      req.log.info(
        { auth_phase: "mobile_sign_up_customer", status: 200, needs_confirmation: true },
        "mobile_sign_up_customer_pending_confirmation",
      );
      return reply.send({
        needs_email_confirmation: true,
        request_id: req.requestId,
      });
    }

    const admin = createServiceSupabase(env);
    const sync = await upsertCustomerForSession(admin, data.user, { full_name: full_name ?? null });
    if (!sync.ok) {
      req.log.error({ auth_phase: "mobile_sign_up_customer", user_id: data.user.id }, "mobile_sign_up_customer_session_sync_failed");
      return brokerError(
        reply,
        req,
        500,
        "SESSION_SYNC_FAILED",
        "PulseFill could not finish setting up your session. Try again shortly.",
        true,
      );
    }

    req.log.info({ auth_phase: "mobile_sign_up_customer", status: 200, user_id: data.user.id }, "mobile_sign_up_customer_ok");
    return reply.send(
      await successPayload(req, admin, { access_token: data.session.access_token, refresh_token: data.session.refresh_token }, data.user),
    );
  }

  app.post("/v1/mobile/auth/sign-up-customer", handleMobileCustomerSignUp);

  /** @deprecated Prefer `POST /v1/mobile/auth/sign-up-customer` — same behavior (customer intent + profile). */
  app.post("/v1/mobile/auth/sign-up", handleMobileCustomerSignUp);

  app.post("/v1/mobile/auth/password-reset", async (req, reply) => {
    const parsed = passwordResetBody.safeParse(req.body ?? {});
    if (!parsed.success) {
      return brokerError(reply, req, 400, "VALIDATION_ERROR", "Enter a valid email address.", false);
    }
    const { email, device_id } = parsed.data;
    const env = req.server.env;

    if ((await assertMobileAuthRateLimit(env, "password-reset", req, email, device_id)) === "limited") {
      return brokerError(reply, req, 429, "RATE_LIMITED", "Too many attempts. Try again shortly.", true);
    }

    const userSb = createUserPasswordSupabase(env);
    const redirectTo = env.CUSTOMER_APP_BASE_URL ? `${env.CUSTOMER_APP_BASE_URL.replace(/\/$/, "")}/auth/callback` : undefined;
    const { error } = await userSb.auth.resetPasswordForEmail(email, redirectTo ? { redirectTo } : undefined);

    if (error) {
      const mapped = mapSupabaseAuthFailure(error);
      req.log.info(
        { auth_phase: "mobile_password_reset", status: mapped.status, code: mapped.code },
        "mobile_password_reset_supabase_failed",
      );
      if (mapped.status >= 500) {
        return brokerError(reply, req, mapped.status, mapped.code, mapped.message, mapped.retryable);
      }
    }

    req.log.info({ auth_phase: "mobile_password_reset", status: 204 }, "mobile_password_reset_ok");
    return reply.code(204).send();
  });

  app.post("/v1/mobile/auth/refresh", async (req, reply) => {
    const parsed = refreshBody.safeParse(req.body ?? {});
    if (!parsed.success) {
      return brokerError(reply, req, 400, "VALIDATION_ERROR", "Invalid refresh request.", false);
    }
    const { refresh_token, device_id } = parsed.data;
    const env = req.server.env;
    const pseudo = createHash("sha256").update(refresh_token).digest("hex").slice(0, 32);

    if ((await assertMobileAuthRateLimit(env, "refresh", req, pseudo, device_id)) === "limited") {
      return brokerError(reply, req, 429, "RATE_LIMITED", "Too many attempts. Try again shortly.", true);
    }

    const userSb = createUserPasswordSupabase(env);
    const { data, error } = await userSb.auth.refreshSession({ refresh_token });

    if (error || !data.session || !data.user) {
      const mapped = mapSupabaseAuthFailure(error ?? { message: "invalid_refresh" });
      req.log.info({ auth_phase: "mobile_refresh", status: mapped.status, code: mapped.code }, "mobile_refresh_failed");
      return brokerError(reply, req, mapped.status, mapped.code, mapped.message, mapped.retryable);
    }

    const admin = createServiceSupabase(env);
    req.log.info({ auth_phase: "mobile_refresh", status: 200, user_id: data.user.id }, "mobile_refresh_ok");
    return reply.send(
      await successPayload(req, admin, { access_token: data.session.access_token, refresh_token: data.session.refresh_token }, data.user),
    );
  });

  app.post("/v1/mobile/auth/sign-out", async (req, reply) => {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      return brokerError(reply, req, 401, "UNAUTHORIZED", "Sign in again to continue.", false);
    }
    const token = header.slice("Bearer ".length).trim();
    if (!token) {
      return brokerError(reply, req, 401, "UNAUTHORIZED", "Sign in again to continue.", false);
    }

    const admin = createServiceSupabase(req.server.env);
    const { data: userData, error: userErr } = await admin.auth.getUser(token);
    if (userErr || !userData.user) {
      return brokerError(reply, req, 401, "INVALID_SESSION", "Sign in again to continue.", false);
    }

    const { error: signOutErr } = await admin.auth.admin.signOut(token, "global");
    if (signOutErr) {
      req.log.warn({ auth_phase: "mobile_sign_out", err: signOutErr.message }, "mobile_sign_out_admin_failed");
      return brokerError(reply, req, 500, "SIGN_OUT_FAILED", "Could not sign out. Try again shortly.", true);
    }

    req.log.info({ auth_phase: "mobile_sign_out", status: 204, user_id: userData.user.id }, "mobile_sign_out_ok");
    return reply.code(204).send();
  });
}
