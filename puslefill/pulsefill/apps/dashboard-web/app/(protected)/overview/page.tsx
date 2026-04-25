import { OverviewPageContent } from "@/components/overview/overview-page-content";
import { requireCurrentUser } from "@/lib/get-current-user";

export default async function OverviewPage() {
  const { user, profile } = await requireCurrentUser();

  return (
    <OverviewPageContent
      displayName={profile.full_name}
      email={user.email ?? profile.email}
      role={profile.role}
      onboardingCompleted={profile.onboarding_completed}
    />
  );
}
