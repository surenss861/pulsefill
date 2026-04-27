/**
 * Parse env URL for logs. Hostnames without a scheme are interpreted as https.
 * Use this to catch `NEXT_PUBLIC_SUPABASE_URL` pasted with `/auth/v1` or `/rest/v1`.
 */
export function safeUrlParts(value?: string | null): {
  host: string | null;
  pathname: string | null;
  valid: boolean;
} {
  const raw = value?.trim();
  if (!raw) return { host: null, pathname: null, valid: false };
  const withScheme =
    raw.startsWith("http://") || raw.startsWith("https://") ? raw : `https://${raw}`;
  try {
    const url = new URL(withScheme);
    return {
      host: url.host,
      pathname: url.pathname || "/",
      valid: true,
    };
  } catch {
    return { host: "INVALID_URL", pathname: "INVALID_URL", valid: false };
  }
}

/** Host only, for compact logs (same rules as {@link safeUrlParts}). */
export function safeUrlHost(value?: string | null): string | null {
  const p = safeUrlParts(value);
  if (!p.valid && p.host === "INVALID_URL") return "INVALID_URL";
  return p.host;
}

/**
 * Supabase JS expects the project API origin only (`https://<ref>.supabase.co`).
 * If the env value wrongly includes `/auth/v1` or `/rest/v1`, strip to origin.
 */
export function normalizeSupabaseProjectUrl(raw: string): string {
  const t = raw.trim();
  if (!t) return t;
  const withScheme = t.startsWith("http://") || t.startsWith("https://") ? t : `https://${t}`;
  try {
    const u = new URL(withScheme);
    if (u.pathname && u.pathname !== "/") {
      console.warn("[supabase] NEXT_PUBLIC_SUPABASE_URL included a path; using origin only.", {
        pathname: u.pathname,
      });
    }
    return u.origin;
  } catch {
    return t;
  }
}
