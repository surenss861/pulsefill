import { getSiteUrl } from "@/lib/site-url";

/**
 * Safe URL host for server logs (Vercel). Never log secrets — hosts/presence only.
 * Hostnames without a scheme are interpreted as https.
 */
export function safeUrlHost(value?: string | null): string | null {
  const v = value?.trim();
  if (!v) return null;
  const withScheme = v.startsWith("http://") || v.startsWith("https://") ? v : `https://${v}`;
  try {
    return new URL(withScheme).host;
  } catch {
    return "INVALID_URL";
  }
}

/** Snapshot for Vercel logs — no secrets (only hostnames / booleans). */
export function getAuthEnvSnapshot(extra?: Record<string, unknown>): Record<string, unknown> {
  const siteRaw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  let resolvedSiteHost: string | null = null;
  try {
    resolvedSiteHost = safeUrlHost(getSiteUrl());
  } catch {
    resolvedSiteHost = "SITE_URL_ERROR";
  }

  return {
    supabaseUrlHost: safeUrlHost(process.env.NEXT_PUBLIC_SUPABASE_URL),
    hasAnonKey: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()),
    nextPublicSiteUrlHost: safeUrlHost(siteRaw),
    resolvedGetSiteUrlHost: resolvedSiteHost,
    vercelUrl: process.env.VERCEL_URL?.trim() ?? null,
    apiHosts: {
      NEXT_PUBLIC_API_BASE_URL: safeUrlHost(process.env.NEXT_PUBLIC_API_BASE_URL),
      NEXT_PUBLIC_PULSEFILL_API_URL: safeUrlHost(process.env.NEXT_PUBLIC_PULSEFILL_API_URL),
      PULSEFILL_API_BASE_URL: safeUrlHost(process.env.PULSEFILL_API_BASE_URL),
    },
    ...extra,
  };
}
