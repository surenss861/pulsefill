import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { SignInClient } from "@/components/auth/sign-in-client";

export const metadata: Metadata = {
  title: "Sign in — PulseFill",
  description: "Staff sign-in for PulseFill — manage openings, claims, and confirmed bookings.",
};

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
