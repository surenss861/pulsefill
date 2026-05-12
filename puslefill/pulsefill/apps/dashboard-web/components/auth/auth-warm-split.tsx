import Link from "next/link";
import type { ReactNode } from "react";
import { AuthSignInPreview } from "@/components/auth/auth-sign-in-preview";

export const AUTH_RECOVERY_BENEFITS = [
  "See cancelled appointments",
  "Send offers to waiting customers",
  "Confirm claimed bookings",
] as const;

type AuthWarmSplitProps = {
  /** Main headline (left column). Ignored when `leadingStory` is set. */
  headline?: string;
  /** Supporting paragraph under the headline. Ignored when `leadingStory` is set. */
  subhead?: string;
  /** Optional custom left story block (e.g. crossfading morph headline). */
  leadingStory?: ReactNode;
  /** Optional benefit list; omit or pass empty to hide. */
  benefits?: readonly string[];
  /** Show the compact homepage-style case-file preview. */
  showCasePreview?: boolean;
  brandHref?: string;
  children: ReactNode;
};

/**
 * Shared warm auth layout: ivory/taupe story column + slot for {@link AuthWarmCard} (or custom right column).
 * Matches `/sign-in` visual direction — no Operator OS / recovery pipeline chrome.
 */
export function AuthWarmSplit({
  headline,
  subhead,
  leadingStory,
  benefits = AUTH_RECOVERY_BENEFITS,
  showCasePreview = true,
  brandHref = "/",
  children,
}: AuthWarmSplitProps) {
  return (
    <main className="pf-auth-shell">
      <div className="pf-auth-split">
        <div className="pf-auth-shell-enter">
          <Link href={brandHref} className="pf-auth-brand">
            PulseFill
          </Link>
          {leadingStory ? (
            leadingStory
          ) : headline != null && subhead != null ? (
            <>
              <h1 className="pf-auth-lede">{headline}</h1>
              <p className="pf-auth-sub">{subhead}</p>
            </>
          ) : null}
          {benefits.length > 0 ? (
            <ul className="pf-auth-benefits">
              {benefits.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : null}
          {showCasePreview ? (
            <div className="pf-auth-preview-wrap">
              <AuthSignInPreview />
            </div>
          ) : null}
        </div>
        {children}
      </div>
    </main>
  );
}
