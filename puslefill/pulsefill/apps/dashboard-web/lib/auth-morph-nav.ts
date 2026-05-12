/**
 * Next.js `<Link>` props for in-app navigation to the morph auth routes.
 * Prevents scroll restoration from jumping the viewport away from the split layout.
 */
export function authMorphLinkProps(href: string): { scroll: false } | Record<string, never> {
  const path = href.split(/[?#]/)[0]?.replace(/\/+$/, "") ?? "";
  if (path === "/sign-in" || path === "/sign-up") {
    return { scroll: false as const };
  }
  return {};
}
