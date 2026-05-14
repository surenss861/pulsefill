"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import type { ProfileRow } from "@/lib/get-current-user";
import { deskContextForPath } from "@/lib/desk-shell-context";

type AppHeaderProps = {
  user: { id: string; email: string };
  profile: ProfileRow;
};

function formatStripTime(d: Date): string {
  return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

/** Thin desk status strip — context + workspace mode + clock (no SaaS account bar). */
export function AppHeader({ user: _user, profile }: AppHeaderProps) {
  const pathname = usePathname() ?? "";
  const live = profile.onboarding_completed;
  const { kicker } = deskContextForPath(pathname);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const mode = live ? "Live" : "Setup pending";

  return (
    <header className="pf-desk-status-strip">
      <div className="pf-desk-status-strip__inner">
        <span className="pf-desk-status-strip__kicker">{kicker}</span>
        <span className="pf-desk-status-strip__dot" aria-hidden>
          ·
        </span>
        <span className={`pf-desk-status-strip__mode${live ? " pf-desk-status-strip__mode--live" : ""}`}>{mode}</span>
        <span className="pf-desk-status-strip__dot" aria-hidden>
          ·
        </span>
        <span className="pf-desk-status-strip__time">Updated {formatStripTime(now)}</span>
      </div>
    </header>
  );
}
