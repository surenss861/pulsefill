"use client";

import { getSupabaseBrowser } from "./supabase-browser";

/** Same browser client as auth; use for postgres_changes subscriptions. */
export function getSupabaseRealtimeClient() {
  return getSupabaseBrowser();
}
