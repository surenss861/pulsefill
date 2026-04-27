"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type AppNavItemProps = {
  href: string;
  label: string;
};

export function AppNavItem({ href, label }: AppNavItemProps) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderRadius: 16,
        padding: "12px 16px",
        fontSize: 14,
        textDecoration: "none",
        border: active ? "1px solid rgba(255, 255, 255, 0.12)" : "1px solid transparent",
        background: active
          ? "linear-gradient(90deg, rgba(255, 122, 24, 0.07), rgba(255, 255, 255, 0.02))"
          : "transparent",
        color: active ? "var(--pf-text-primary)" : "rgba(245, 247, 250, 0.58)",
        transition: "border 0.15s ease, background 0.15s ease, color 0.15s ease",
      }}
    >
      <span>{label}</span>
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: 999,
          background: active ? "var(--pf-accent-primary)" : "transparent",
          boxShadow: active ? "0 0 10px rgba(255, 122, 24, 0.2)" : "none",
        }}
      />
    </Link>
  );
}
