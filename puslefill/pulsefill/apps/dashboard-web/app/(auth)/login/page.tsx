import { redirect } from "next/navigation";

export default async function LoginRedirectPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const sp = await searchParams;
  const next = sp.next;
  const qs = next ? `?next=${encodeURIComponent(next)}` : "";
  redirect(`/sign-in${qs}`);
}
