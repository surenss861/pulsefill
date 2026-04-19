import fp from "fastify-plugin";
import type { FastifyInstance, FastifyRequest } from "fastify";
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

    const { data, error } = await admin.auth.getUser(token);
    if (error || !data.user) return;
    req.authUser = data.user;
  });
});
