import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { normalizeSupabaseProjectUrl } from "@/lib/supabase/project-url";

/** Thrown when Supabase browser env vars are absent — catch in server actions and return a form error. */
export class SupabaseConfigError extends Error {
  constructor() {
    super("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
    this.name = "SupabaseConfigError";
  }
}

export async function createClient() {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!rawUrl || !anon) {
    throw new SupabaseConfigError();
  }

  const url = normalizeSupabaseProjectUrl(rawUrl);
  const cookieStore = await cookies();

  return createServerClient(url, anon, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          /* ignored when called from a Server Component that cannot set cookies */
        }
      },
    },
  });
}
