import { redirect } from "next/navigation";

/** Canonical recovery worklist lives at `/action-queue`. */
export default function DashboardAliasPage() {
  redirect("/action-queue");
}
