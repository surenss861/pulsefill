import { cache } from "react";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export type ProfileRow = {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  onboarding_completed: boolean;
};

export type CurrentUser = {
  user: User;
  profile: ProfileRow | null;
};

export type AuthenticatedUser = {
  user: User;
  profile: ProfileRow;
};

/** Returns the authenticated user and profile when Supabase is configured; null if signed out or env missing. */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile } = await supabase
      .from("profiles")
      .select("id, email, full_name, role, onboarding_completed")
      .eq("id", user.id)
      .maybeSingle();

    return { user, profile: profile as ProfileRow | null };
  } catch {
    return null;
  }
}

/**
 * Server-only gate for the app shell. Uses Supabase session cookies (not legacy localStorage JWT).
 * Redirects to sign-in with `?next=` when possible (see middleware `x-pathname`).
 */
export const requireCurrentUser = cache(async (): Promise<AuthenticatedUser> => {
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || "/overview";
  const nextParam = pathname.startsWith("/") ? pathname : "/overview";

  let supabase;
  try {
    supabase = await createClient();
  } catch {
    redirect(`/sign-in?next=${encodeURIComponent(nextParam)}`);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/sign-in?next=${encodeURIComponent(nextParam)}`);
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, onboarding_completed")
    .eq("id", user.id)
    .maybeSingle();

  if (error || !profile) {
    redirect("/auth/error?reason=profile");
  }

  return { user, profile: profile as ProfileRow };
});
