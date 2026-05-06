import assert from "node:assert/strict";
import test from "node:test";

/**
 * Mirrors `apps/dashboard-web/lib/customer-follow-up.ts` — update both if behavior changes.
 */
function buildStaffMailtoHref(email: string, subject = "PulseFill standby update"): string {
  const e = email.trim();
  return `mailto:${encodeURIComponent(e)}?subject=${encodeURIComponent(subject)}`;
}

function buildTelHref(phone: string): string {
  return `tel:${encodeURIComponent(phone.trim())}`;
}

async function copyTextWithOptionalClipboard(
  text: string,
  clipboardWriteText?: ((value: string) => Promise<void>) | false,
): Promise<"copied" | "unavailable" | "denied"> {
  if (clipboardWriteText === false) return "unavailable";
  const nav = typeof globalThis !== "undefined" ? (globalThis as { navigator?: { clipboard?: { writeText?: (t: string) => Promise<void> } } }).navigator : undefined;
  const write =
    clipboardWriteText ?? (nav?.clipboard?.writeText != null ? nav.clipboard.writeText.bind(nav.clipboard) : undefined);
  if (typeof write !== "function") return "unavailable";
  try {
    await write(text);
    return "copied";
  } catch {
    return "denied";
  }
}

test("buildStaffMailtoHref encodes address and subject", () => {
  const href = buildStaffMailtoHref("pat@example.com");
  assert.ok(href.startsWith("mailto:"));
  assert.ok(href.includes("subject="));
  assert.ok(href.includes(encodeURIComponent("PulseFill standby update")));
});

test("buildTelHref encodes trimmed phone", () => {
  assert.equal(buildTelHref("+1 555 0100"), "tel:" + encodeURIComponent("+1 555 0100"));
});

test("copyTextWithOptionalClipboard returns unavailable when forced (no API)", async () => {
  assert.equal(await copyTextWithOptionalClipboard("x", false), "unavailable");
});

test("copyTextWithOptionalClipboard uses injected writer", async () => {
  let seen = "";
  const r = await copyTextWithOptionalClipboard("hello", async (t) => {
    seen = t;
  });
  assert.equal(r, "copied");
  assert.equal(seen, "hello");
});

test("copyTextWithOptionalClipboard returns denied when writer throws", async () => {
  const r = await copyTextWithOptionalClipboard("x", async () => {
    throw new Error("no");
  });
  assert.equal(r, "denied");
});
