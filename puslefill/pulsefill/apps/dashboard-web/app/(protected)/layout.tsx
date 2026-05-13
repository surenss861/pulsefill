import { AppShell } from "@/components/app-shell/app-shell";
import { requireCurrentUser } from "@/lib/get-current-user";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { user, profile } = await requireCurrentUser();

  return (
    <AppShell user={{ id: user.id, email: user.email ?? "" }} profile={profile}>
      {children}
    </AppShell>
  );
}
