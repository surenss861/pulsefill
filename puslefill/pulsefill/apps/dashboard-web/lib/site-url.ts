/**
 * Site origin for Supabase redirect URLs (no trailing slash).
 *
 * Priority:
 * 1. `NEXT_PUBLIC_SITE_URL` — set this in Vercel Production to your canonical domain
 *    (e.g. `https://pulsefill.vercel.app` or your custom domain). Origin only, no path.
 * 2. On Vercel **production** only: `VERCEL_PROJECT_PRODUCTION_URL` (system env) — avoids
 *    using `VERCEL_URL`, which is the unique deployment hostname and is usually not in
 *    Supabase redirect allowlists.
 * 3. `VERCEL_URL` — preview / dev on Vercel; add matching URLs in Supabase if you test auth there.
 * 4. Local: `http://localhost:3000`
 */
export function getSiteUrl(): string {
  let explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  if (explicit) {
    if (!explicit.startsWith("http://") && !explicit.startsWith("https://")) {
      explicit = `https://${explicit}`;
    }
    return explicit;
  }

  const productionHost =
    process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim().replace(/\/$/, "") ||
    process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL?.trim().replace(/\/$/, "");

  if (process.env.VERCEL_ENV === "production" && productionHost) {
    return `https://${productionHost}`;
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.replace(/\/$/, "")}`;
  }

  return "http://localhost:3000";
}
