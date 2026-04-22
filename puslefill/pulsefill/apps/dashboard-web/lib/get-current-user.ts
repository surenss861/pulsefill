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
