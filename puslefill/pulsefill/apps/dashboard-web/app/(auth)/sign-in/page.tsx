import type { Metadata } from "next";
import { Suspense } from "react";
import { SignInClient } from "@/components/auth/sign-in-client";

export const metadata: Metadata = {
  title: "Sign in — PulseFill",
  description: "Staff sign-in for PulseFill — manage openings, claims, and confirmed bookings.",
};

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <main className="pf-auth-shell" style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <p style={{ margin: 0, fontSize: 14, color: "var(--pf-text-muted)" }}>Loading…</p>
        </main>
      }
    >
      <SignInClient />
    </Suspense>
  );
}
