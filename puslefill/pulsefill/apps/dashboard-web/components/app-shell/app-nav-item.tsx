"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

type AppNavItemProps = {
  href: string;
  label: string;
  icon?: ReactNode;
};

export function AppNavItem({ href, label, icon }: AppNavItemProps) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      className={`pf-nav-dock-link${active ? " pf-nav-dock-link--active" : ""}`}
    >
      {icon ? <span className="pf-nav-dock-link__glyph">{icon}</span> : null}
      <span className="pf-nav-dock-link__label">{label}</span>
    </Link>
  );
}
