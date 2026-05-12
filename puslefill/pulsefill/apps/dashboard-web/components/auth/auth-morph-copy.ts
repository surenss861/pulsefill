export type AuthMorphMode = "sign-in" | "sign-up";

export function authMorphModeFromPath(pathname: string | null): AuthMorphMode | null {
  if (!pathname) return null;
  const normalized = pathname.replace(/\/+$/, "") || "/";
  if (normalized === "/sign-up") return "sign-up";
  if (normalized === "/sign-in") return "sign-in";
  return null;
}

export const AUTH_MORPH_COPY: Record<
  AuthMorphMode,
  { headline: string; subhead: string; eyebrow: string; title: string; lede: string }
> = {
  "sign-in": {
    headline: "Sign in to run today's recovery.",
    subhead: "Manage openings, claims, and confirmed bookings before the day slips away.",
    eyebrow: "Staff access",
    title: "Sign in",
    lede: "Access your PulseFill workspace and keep recovery moving.",
  },
  "sign-up": {
    headline: "Create your workspace for recovery.",
    subhead:
      "Set up staff access so your team can turn cancellations into confirmed bookings — with offers, claims, and one calm queue.",
    eyebrow: "New workspace",
    title: "Create account",
    lede: "Add your details to start using PulseFill for your business.",
  },
};
