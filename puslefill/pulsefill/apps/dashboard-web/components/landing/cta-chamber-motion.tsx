"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRef, type ReactNode } from "react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

export function CtaChamberMotion({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = root.current;
      if (!el) return;

      const ctx = gsap.context(() => {
        const reveals = el.querySelectorAll("[data-cta-reveal]");
        const glow = el.querySelector("[data-cta-glow]");

        gsap.fromTo(
          reveals,
          { opacity: 0, y: 22 },
          {
            opacity: 1,
            y: 0,
            duration: 0.75,
            stagger: 0.1,
            ease: "power2.out",
            scrollTrigger: {
              trigger: el,
              start: "top 82%",
              toggleActions: "play none none none",
            },
          },
        );

        if (glow) {
          gsap.fromTo(
            glow,
            { opacity: 0.35, scale: 0.92 },
            {
              opacity: 1,
              scale: 1,
              duration: 1.1,
              ease: "power2.inOut",
              scrollTrigger: {
                trigger: el,
                start: "top 88%",
                end: "top 40%",
                scrub: 0.8,
              },
            },
          );
        }
      }, el);

      return () => ctx.revert();
    },
    { scope: root },
  );

  return (
    <div ref={root} style={{ position: "relative" }}>
      {children}
    </div>
  );
}
