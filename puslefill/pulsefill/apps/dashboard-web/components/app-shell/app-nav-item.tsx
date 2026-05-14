"use client";

import Link from "next/link";
import { motion } from "framer-motion";
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
      className={`pf-nav-dock-link${active ? " pf-nav-dock-link--active pf-nav-dock-link--pill-track" : ""}`}
    >
      {active ? (
        <motion.span
          aria-hidden
          layoutId="pf-sidebar-nav-active-pill"
          className="pf-nav-dock-active-pill-morph"
          transition={{ type: "spring", stiffness: 440, damping: 38 }}
        />
      ) : null}
      <span className="pf-nav-dock-link__row">
        {icon ? <span className="pf-nav-dock-link__glyph">{icon}</span> : null}
        <span className="pf-nav-dock-link__label">{label}</span>
      </span>
    </Link>
  );
}
