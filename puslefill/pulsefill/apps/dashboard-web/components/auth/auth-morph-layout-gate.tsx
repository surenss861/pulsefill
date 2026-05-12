"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AuthMorphShell } from "@/components/auth/auth-morph-shell";
import { authMorphModeFromPath } from "@/components/auth/auth-morph-copy";

export function AuthMorphLayoutGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (!authMorphModeFromPath(pathname)) {
    return <>{children}</>;
  }
  return <AuthMorphShell>{children}</AuthMorphShell>;
}
