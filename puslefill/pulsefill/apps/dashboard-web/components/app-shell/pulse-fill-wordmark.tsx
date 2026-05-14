import Link from "next/link";
import type { SVGProps } from "react";

function PulseMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg width={34} height={34} viewBox="0 0 34 34" fill="none" aria-hidden {...props}>
      <defs>
        <linearGradient id="pfPulseMarkStroke" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffd4a8" />
          <stop offset="55%" stopColor="#ff7a18" />
          <stop offset="100%" stopColor="#c45a12" />
        </linearGradient>
        <linearGradient id="pfPulseMarkFill" x1="0.2" y1="0" x2="0.9" y2="1">
          <stop offset="0%" stopColor="rgba(255, 122, 24, 0.22)" />
          <stop offset="100%" stopColor="rgba(8, 7, 6, 0.92)" />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="32" height="32" rx="10" fill="url(#pfPulseMarkFill)" stroke="url(#pfPulseMarkStroke)" strokeWidth="1" />
      <path
        d="M9 17.5c1.8-4.2 3.4-6.3 5.2-6.3 2.4 0 3.1 3.8 5.3 3.8 2.1 0 2.8-2.1 5.5-5.8"
        stroke="url(#pfPulseMarkStroke)"
        strokeWidth="2.1"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M9 20.5c2.2 2.8 4.1 4.2 6.1 4.2 2.8 0 4-2.6 6.4-6.1"
        stroke="url(#pfPulseMarkStroke)"
        strokeWidth="1.35"
        strokeLinecap="round"
        opacity={0.55}
        fill="none"
      />
    </svg>
  );
}

/**
 * Sidebar brand: mark + wordmark (warm ivory / ember). Links home to Today.
 */
export function PulseFillWordmark() {
  return (
    <Link
      href="/overview"
      className="pf-sidebar-wordmark"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        textDecoration: "none",
        color: "inherit",
        minWidth: 0,
      }}
    >
      <PulseMark style={{ flexShrink: 0 }} />
      <span
        style={{
          fontSize: 19,
          fontWeight: 700,
          letterSpacing: "-0.03em",
          lineHeight: 1.05,
          color: "var(--pf-text-primary)",
          fontFamily: "var(--pf-font-sans)",
        }}
      >
        Pulse
        <span style={{ color: "var(--pf-accent-primary-hover)" }}>Fill</span>
      </span>
    </Link>
  );
}
