import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";

export default function StaffLoginPage() {
  return (
    <Suspense
      fallback={
        <main style={{ padding: 40 }}>
          <p style={{ color: "var(--muted)" }}>Loading…</p>
        </main>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
