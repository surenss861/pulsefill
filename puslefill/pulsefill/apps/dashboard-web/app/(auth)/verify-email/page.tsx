import { redirect } from "next/navigation";

/** Alias for check-email / marketing copy that uses “verify email”. */
export default async function VerifyEmailAliasPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) {
    if (v === undefined) continue;
    if (Array.isArray(v)) v.forEach((x) => q.append(k, x));
    else q.set(k, v);
  }
  if (!q.has("flow")) q.set("flow", "signup");
  const qs = q.toString();
  redirect(`/check-email?${qs}`);
}
