import { Suspense } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { SignInClient } from "@/components/auth/sign-in-client";

export default function SignInPage() {
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
      <SignInClient />
    </Suspense>
  );
}
