/** Clipboard / mailto helpers for staff follow-up (see `apps/api/src/test/customer-follow-up-clipboard.test.ts` mirror). */
const DEFAULT_MAILTO_SUBJECT = "PulseFill standby update";

/** Staff mailto link with a fixed subject line (no backend send). */
export function buildStaffMailtoHref(email: string, subject: string = DEFAULT_MAILTO_SUBJECT): string {
  const e = email.trim();
  return `mailto:${encodeURIComponent(e)}?subject=${encodeURIComponent(subject)}`;
}

/** tel: href for a stored phone string (no normalization beyond trim). */
export function buildTelHref(phone: string): string {
  return `tel:${encodeURIComponent(phone.trim())}`;
}

export type ClipboardCopyResult = "copied" | "unavailable" | "denied";

/**
 * Clipboard write with injectable writer (tests) or browser API.
 * Returns `unavailable` when Clipboard API is missing (no throw).
 * Pass `false` as the second argument in tests to force the missing-clipboard path.
 */
export async function copyTextWithOptionalClipboard(
  text: string,
  clipboardWriteText?: ((value: string) => Promise<void>) | false,
): Promise<ClipboardCopyResult> {
  if (clipboardWriteText === false) return "unavailable";
  const write =
    clipboardWriteText ??
    (typeof navigator !== "undefined" && navigator.clipboard?.writeText?.bind(navigator.clipboard));
  if (typeof write !== "function") return "unavailable";
  try {
    await write(text);
    return "copied";
  } catch {
    return "denied";
  }
}
