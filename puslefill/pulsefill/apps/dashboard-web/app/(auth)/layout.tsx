import { redirect } from "next/navigation";
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
  } catch {
    /* Missing Supabase env — still render auth routes for local UI. */
  }

  return children;
}
