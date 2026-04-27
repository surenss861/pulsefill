import { SupabaseConfigError } from "@/lib/supabase/server";

/** Next.js `redirect()` throws an error with a digest starting with `NEXT_REDIRECT`. */
export function isNextRedirectError(error: unknown): boolean {
  if (typeof error !== "object" || error === null || !("digest" in error)) return false;
  const digest = (error as { digest?: string }).digest;
  return typeof digest === "string" && digest.startsWith("NEXT_REDIRECT");
}

/** Map unknown server-action failures to safe form messages; rethrows redirects. */
export function authFormErrorFromUnknown(context: string, error: unknown): { error: string } {
  if (isNextRedirectError(error)) throw error;
  if (error instanceof SupabaseConfigError) {
    console.error(`[auth] ${context}: Supabase is not configured (missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY)`);
    return { error: "Authentication is not configured. Please contact support." };
  }
  console.error(`[auth] ${context} failed`, error);
  return { error: "Something went wrong. Please try again." };
}

/** Hide transport / URL-construction noise; keep normal Supabase validation copy. */
export function userFacingSupabaseMessage(raw: string, fallback: string): string {
  const msg = raw.trim();
  if (!msg) return fallback;
  const lower = msg.toLowerCase();
  const looksInternal =
    lower.includes("invalid path") ||
    lower.includes("request url") ||
    lower.includes("fetch failed") ||
    lower.includes("failed to fetch") ||
    lower.includes("network") ||
    lower.includes("econn") ||
    lower.includes("enotfound") ||
    lower.includes("certificate") ||
    lower.includes("ssl") ||
    lower.includes("tls") ||
    lower.includes("timeout") ||
    lower.includes("syntaxerror") ||
    lower.includes("unexpected token") ||
    msg.length > 220;
  return looksInternal ? fallback : msg;
}
