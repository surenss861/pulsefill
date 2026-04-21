import fp from "fastify-plugin";
import type { FastifyInstance, FastifyRequest } from "fastify";
import type { User } from "@supabase/supabase-js";
import type { Env } from "../config/env.js";
import { createServiceSupabase } from "../config/supabase.js";

type AuthOpts = { env: Env };

export default fp<AuthOpts>(async (app: FastifyInstance, opts: AuthOpts) => {
  const admin = createServiceSupabase(opts.env);

  app.addHook("preHandler", async (req: FastifyRequest) => {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) return;
    const token = header.slice("Bearer ".length).trim();
    if (!token) return;

    if (process.env.PULSEFILL_API_TEST === "1" && token === "test-token") {
      const id =
        process.env.PULSEFILL_TEST_AUTH_USER_ID ?? "44444444-4444-4444-8444-444444444444";
      req.authUser = {
        id,
        email: "operator-route-test@pulsefill.invalid",
        app_metadata: {},
        user_metadata: {},
        aud: "authenticated",
        created_at: new Date().toISOString(),
      } as User;
      return;
    }

    const { data, error } = await admin.auth.getUser(token);
    if (error || !data.user) return;
    req.authUser = data.user;
  });
});
