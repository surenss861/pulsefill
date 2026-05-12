"use client";

import Link from "next/link";
import type { ComponentProps } from "react";

/** Same-route-group navigation without scroll jump; pairs with {@link AuthMorphShell}. */
export function AuthModeTransitionLink({
  href,
  children,
  className,
  ...rest
}: ComponentProps<typeof Link>) {
  return (
    <Link href={href} scroll={false} prefetch className={className} {...rest}>
      {children}
    </Link>
  );
}
