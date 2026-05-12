import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";

export default function StaffLoginPage() {
  return (
    <Suspense
      fallback={
        <main className="pf-auth-shell" style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <p style={{ margin: 0, fontSize: 14, color: "var(--pf-text-muted)" }}>Loading…</p>
        </main>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
