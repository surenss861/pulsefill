import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Env } from "./env.js";

export function createServiceSupabase(env: Env): SupabaseClient {
  return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Supabase Auth password / signup / recovery — uses anon/publishable key when set (preferred), else service role (dev/test). */
export function createUserPasswordSupabase(env: Env): SupabaseClient {
  const key = env.SUPABASE_ANON_KEY?.trim() || env.SUPABASE_SERVICE_ROLE_KEY;
  return createClient(env.SUPABASE_URL, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
