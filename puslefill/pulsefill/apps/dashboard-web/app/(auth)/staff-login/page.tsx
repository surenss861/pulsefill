import { Suspense } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";

export default function StaffLoginPage() {
  return (
    <Suspense
      fallback={
        <AuthShell variant="center">
          <p className="pf-muted-copy" style={{ textAlign: "center", margin: 0 }}>
            Loading…
          </p>
        </AuthShell>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
