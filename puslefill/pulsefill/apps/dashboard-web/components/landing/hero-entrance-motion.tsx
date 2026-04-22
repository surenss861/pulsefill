"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useRef, type ReactNode } from "react";

gsap.registerPlugin(useGSAP);

export function HeroEntranceMotion({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!root.current) return;
      const parts = root.current.querySelectorAll("[data-hero-reveal]");
      gsap.fromTo(
        parts,
        { opacity: 0, y: 26 },
        { opacity: 1, y: 0, duration: 0.72, stagger: 0.085, ease: "power3.out", delay: 0.06 },
      );
      const stage = root.current.querySelector("[data-hero-stage]");
      if (stage) {
        gsap.fromTo(
          stage,
          { opacity: 0, y: 40, scale: 0.96 },
          { opacity: 1, y: 0, scale: 1, duration: 0.95, ease: "power3.out", delay: 0.18 },
        );
      }
    },
    { scope: root },
  );

  return (
    <div ref={root} style={{ position: "relative" }}>
      {children}
    </div>
  );
}
