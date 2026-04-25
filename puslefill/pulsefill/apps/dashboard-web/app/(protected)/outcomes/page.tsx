import { OutcomesPageClient } from "@/components/outcomes/outcomes-page-client";
import { requireCurrentUser } from "@/lib/get-current-user";

export default async function OutcomesPage() {
  await requireCurrentUser();

  return <OutcomesPageClient />;
}
