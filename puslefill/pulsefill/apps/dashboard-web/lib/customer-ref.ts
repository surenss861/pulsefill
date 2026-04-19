/**
 * Customer display helpers for operator UI.
 * Prefer `displayCustomer` everywhere; it picks the best label when profile fields exist.
 */

/** Readable handle when only a UUID is available. */
export function formatCustomerRef(id: string | null | undefined): string {
  if (!id) return "—";
  const s = id.trim();
  if (s.length <= 14) return s;
  return `${s.slice(0, 4)}…${s.slice(-4)}`;
}

export type CustomerProfileFields = {
  display_name?: string | null;
  /** Alias if your API uses `name` instead */
  name?: string | null;
  email?: string | null;
  phone?: string | null;
};

function maskEmail(email: string): string {
  const at = email.indexOf("@");
  if (at <= 0) return `${email.slice(0, 2)}…`;
  const user = email.slice(0, at);
  const domain = email.slice(at + 1);
  if (user.length <= 2) return `${user[0] ?? "?"}…@${domain}`;
  return `${user.slice(0, 2)}…@${domain}`;
}

function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 4) return "…";
  return `…${digits.slice(-4)}`;
}

/**
 * Operator-facing label: real name → masked email → masked phone → short id.
 * Pass optional profile when you have it (e.g. future `GET /v1/customers/:id` for staff).
 */
export function displayCustomer(
  id: string | null | undefined,
  profile?: CustomerProfileFields | null,
): string {
  if (!id?.trim()) return "—";

  const name = profile?.display_name ?? profile?.name;
  if (name?.trim()) return name.trim();

  const email = profile?.email?.trim();
  if (email) return maskEmail(email);

  const phone = profile?.phone?.trim();
  if (phone) return maskPhone(phone);

  return formatCustomerRef(id);
}
