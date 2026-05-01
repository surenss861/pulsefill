import type { User } from "@supabase/supabase-js";
import type { Env } from "../config/env.js";

declare module "fastify" {
  interface FastifyRequest {
    /** Set by `request-id` plugin on every request. */
    requestId: string;
    authUser?: User;
    staff?: { id: string; business_id: string; role: string };
    customer?: { id: string };
  }

  interface FastifyInstance {
    env: Env;
  }
}
