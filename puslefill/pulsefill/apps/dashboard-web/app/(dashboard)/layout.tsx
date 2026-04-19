import { StaffAuthGuard } from "@/components/auth/staff-auth-guard";
import { Sidebar } from "@/components/shell/sidebar";
import { ToastProvider } from "@/components/ui/toast-provider";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <StaffAuthGuard>
      <ToastProvider>
        <div style={{ display: "flex", minHeight: "100vh" }}>
          <Sidebar />
          <div style={{ flex: 1, padding: 24 }}>{children}</div>
        </div>
      </ToastProvider>
    </StaffAuthGuard>
  );
}
