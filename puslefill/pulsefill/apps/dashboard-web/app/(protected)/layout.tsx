import { AppShell } from "@/components/app-shell/app-shell";
import { ToastProvider } from "@/components/ui/toast-provider";
import { requireCurrentUser } from "@/lib/get-current-user";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { user, profile } = await requireCurrentUser();

  return (
    <ToastProvider>
      <AppShell user={{ id: user.id, email: user.email ?? "" }} profile={profile}>
        {children}
      </AppShell>
    </ToastProvider>
  );
}
