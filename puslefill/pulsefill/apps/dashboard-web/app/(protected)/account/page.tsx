import { redirect } from "next/navigation";

/** Canonical settings surface lives at `/settings`; keep `/account` for bookmarks and future split. */
export default function AccountRedirectPage() {
  redirect("/settings");
}
