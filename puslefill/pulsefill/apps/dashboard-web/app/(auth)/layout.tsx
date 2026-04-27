import { redirect } from "next/navigation";
import { isNextRedirectError } from "@/lib/auth-action-errors";
import { createClient } from "@/lib/supabase/server";

export default async function AuthGroupLayout({ children }: { children: React.ReactNode }) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      redirect("/overview");
    }
  } catch (e) {
    if (isNextRedirectError(e)) throw e;
    /* Missing Supabase env or transient auth read failure — still render auth routes. */
  }

  return children;
}
