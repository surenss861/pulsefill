import type { User } from "@supabase/supabase-js";
import type { Env } from "../config/env.js";

declare module "fastify" {
  interface FastifyInstance {
    env: Env;
  }

  interface FastifyRequest {
    authUser?: User;
    staff?: { id: string; business_id: string; role: string };
    customer?: { id: string };
  }
}
