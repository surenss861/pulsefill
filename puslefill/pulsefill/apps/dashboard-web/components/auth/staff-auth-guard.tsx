"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getStaffSession } from "@/lib/auth";
import { hasLegacyStaffToken } from "@/lib/api";

export function StaffAuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      const session = await getStaffSession();
      if (cancelled) return;
      if (session) {
        setReady(true);
        return;
      }
      if (hasLegacyStaffToken()) {
        setReady(true);
        return;
      }
      router.replace(`/sign-in?next=${encodeURIComponent(pathname)}`);
    }

    void check();
    return () => {
      cancelled = true;
    };
  }, [router, pathname]);

  if (!ready) {
    return (
      <main style={{ display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "var(--muted)" }}>Loading dashboard…</p>
      </main>
    );
  }

  return <>{children}</>;
}
