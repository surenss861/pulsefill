import { Suspense } from "react";
import { SignInClient } from "@/components/auth/sign-in-client";

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted)" }}>
          Loading…
        </main>
      }
    >
      <SignInClient />
    </Suspense>
  );
}
