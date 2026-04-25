import { SettingsPageClient } from "@/components/settings/settings-page-client";
import { requireCurrentUser } from "@/lib/get-current-user";

export default async function SettingsPage() {
  const { user, profile } = await requireCurrentUser();

  return (
    <SettingsPageClient
      authEmail={user.email ?? null}
      profile={profile}
      lastSignInAt={user.last_sign_in_at ?? null}
    />
  );
}
