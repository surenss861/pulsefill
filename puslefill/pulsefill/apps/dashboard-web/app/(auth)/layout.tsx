import type { ReactNode } from "react";
import { AuthMorphLayoutGate } from "@/components/auth/auth-morph-layout-gate";

export default function AuthSegmentLayout({ children }: { children: ReactNode }) {
  return <AuthMorphLayoutGate>{children}</AuthMorphLayoutGate>;
}
