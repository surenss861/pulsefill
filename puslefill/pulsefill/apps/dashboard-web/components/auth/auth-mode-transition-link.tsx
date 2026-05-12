"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { authMorphLinkProps } from "@/lib/auth-morph-nav";

/** Same-route-group navigation without scroll jump; pairs with {@link AuthMorphShell}. */
export function AuthModeTransitionLink({
  href,
  children,
  className,
  ...rest
}: ComponentProps<typeof Link>) {
  const morph = authMorphLinkProps(typeof href === "string" ? href : "");
  return (
    <Link href={href} prefetch className={className} {...rest} {...morph}>
      {children}
    </Link>
  );
}
