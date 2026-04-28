import { redirect } from "next/navigation";

/**
 * Legacy route kept for backwards compatibility.
 * Production-safe server redirect avoids stale /slots crashes.
 */
export default function LegacySlotsPage() {
  redirect("/open-slots");
}
