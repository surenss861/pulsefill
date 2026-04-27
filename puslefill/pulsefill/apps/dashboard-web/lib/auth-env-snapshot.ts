import { getSiteUrl } from "@/lib/site-url";
import { safeUrlHost, safeUrlParts } from "@/lib/supabase/project-url";

/** Snapshot for Vercel logs — no secrets (only URL shape / booleans). */
export function getAuthEnvSnapshot(extra?: Record<string, unknown>): Record<string, unknown> {
  const siteRaw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  let resolvedSiteUrlParts = safeUrlParts(null);
  try {
    resolvedSiteUrlParts = safeUrlParts(getSiteUrl());
  } catch {
    resolvedSiteUrlParts = { host: "SITE_URL_ERROR", pathname: "SITE_URL_ERROR", valid: false };
  }

  return {
    supabaseUrl: safeUrlParts(process.env.NEXT_PUBLIC_SUPABASE_URL),
    hasAnonKey: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()),
    nextPublicSiteUrl: safeUrlParts(siteRaw),
    resolvedSiteUrl: resolvedSiteUrlParts,
    vercelUrl: process.env.VERCEL_URL?.trim() ?? null,
    apiHosts: {
      NEXT_PUBLIC_API_BASE_URL: safeUrlHost(process.env.NEXT_PUBLIC_API_BASE_URL),
      NEXT_PUBLIC_PULSEFILL_API_URL: safeUrlHost(process.env.NEXT_PUBLIC_PULSEFILL_API_URL),
      PULSEFILL_API_BASE_URL: safeUrlHost(process.env.PULSEFILL_API_BASE_URL),
    },
    ...extra,
  };
}
