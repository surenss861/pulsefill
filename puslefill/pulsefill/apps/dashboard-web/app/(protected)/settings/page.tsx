import { requireCurrentUser } from "@/lib/get-current-user";
import { SettingsPageClient } from "./settings-page-client";

export default async function SettingsPage() {
  const { user, profile } = await requireCurrentUser();

  return (
    <SettingsPageClient
      displayName={profile.full_name}
      email={profile.email}
      role={profile.role}
      lastSignInAt={user.last_sign_in_at ?? null}
    />
  );
}
