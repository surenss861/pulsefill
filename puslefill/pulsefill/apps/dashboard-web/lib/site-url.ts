/** Site origin for Supabase redirect URLs (no trailing slash). */
export function getSiteUrl(): string {
  let explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  if (explicit) {
    if (!explicit.startsWith("http://") && !explicit.startsWith("https://")) {
      explicit = `https://${explicit}`;
    }
    return explicit;
  }
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL.replace(/\/$/, "")}`;
  return "http://localhost:3000";
}
