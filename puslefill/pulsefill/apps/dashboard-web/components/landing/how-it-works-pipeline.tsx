"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRef, useState } from "react";
import type { PipelineStep } from "@/components/landing/landing-data";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const TOKENS = {
  text: "var(--pf-text-primary)",
  muted: "var(--pf-text-secondary)",
  tertiary: "var(--pf-text-tertiary)",
  borderSubtle: "var(--pf-border-subtle)",
  ember: "var(--pf-accent-primary)",
} as const;

export function HowItWorksPipeline({ steps }: { steps: PipelineStep[] }) {
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const root = rootRef.current;
      const line = lineRef.current;
      if (!root || !line) return;

      const ctx = gsap.context(() => {
        gsap.fromTo(
          line,
          { scaleX: 0.04, opacity: 0.35 },
          {
            scaleX: 1,
            opacity: 0.75,
            duration: 1.05,
            ease: "power2.inOut",
            transformOrigin: "left center",
            scrollTrigger: {
              trigger: root,
              start: "top 78%",
              end: "top 42%",
              scrub: 0.35,
            },
          },
        );

        ScrollTrigger.create({
          trigger: root,
          start: "top 55%",
          end: "bottom 38%",
          scrub: 0.25,
          onUpdate: (self) => {
            const i = Math.min(steps.length - 1, Math.max(0, Math.floor(self.progress * steps.length)));
            setActive(i);
          },
        });
      }, root);

      return () => {
        ctx.revert();
      };
    },
    { scope: rootRef, dependencies: [steps] },
  );

  return (
    <div ref={rootRef} style={{ position: "relative" }}>
      <div
        ref={lineRef}
        aria-hidden
        style={{
          position: "absolute",
          left: "3%",
          right: "3%",
          top: 8,
          height: 2,
          borderRadius: 1,
          background: "linear-gradient(90deg, rgba(255,255,255,0.06), rgba(255,122,24,0.35), rgba(255,255,255,0.06))",
          transformOrigin: "left center",
        }}
      />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 188px), 1fr))",
          gap: 8,
          alignItems: "stretch",
        }}
      >
        {steps.map(({ step, title, body, emphasis }, idx) => {
          const isOp = emphasis === "operator";
          const isBook = emphasis === "bookend";
          const inactive = isBook || emphasis === "bridge";
          const isActive = idx === active;
          return (
            <div key={step} style={{ paddingTop: 2 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                <div
                  style={{
                    width: isOp ? 22 : 19,
                    height: isOp ? 22 : 19,
                    borderRadius: 999,
                    display: "grid",
                    placeItems: "center",
                    fontSize: 10,
                    fontWeight: 700,
                    color: isActive ? TOKENS.text : "rgba(226,232,240,0.5)",
                    background: isActive
                      ? "linear-gradient(145deg, rgba(255,122,24,0.55), rgba(10,12,20,0.98))"
                      : "rgba(8,10,16,0.96)",
                    border: isActive ? `1px solid rgba(253,186,116,0.55)` : `1px solid rgba(255,255,255,0.07)`,
                    boxShadow: isActive ? "0 0 18px rgba(255,122,24,0.22)" : "none",
                    flexShrink: 0,
                    transition: "box-shadow 0.35s ease, border-color 0.35s ease, opacity 0.35s ease",
                  }}
                >
                  {step}
                </div>
                <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.05)", minWidth: 6, borderRadius: 1 }} />
              </div>
              <div
                style={{
                  borderRadius: isOp ? 12 : 8,
                  padding: isOp ? "14px 12px 16px" : "11px 10px 12px",
                  minHeight: isOp ? 96 : isBook ? 76 : 80,
                  background: isActive ? "rgba(255,122,24,0.1)" : isOp ? "rgba(255,122,24,0.07)" : "rgba(0,0,0,0.38)",
                  border: isActive
                    ? "1px solid rgba(255,122,24,0.55)"
                    : isOp
                      ? "1px solid rgba(255,122,24,0.42)"
                      : "1px solid rgba(255,255,255,0.05)",
                  boxShadow: isActive
                    ? "0 12px 40px rgba(0,0,0,0.45), 0 0 28px rgba(255,122,24,0.12)"
                    : isOp
                      ? "0 10px 32px rgba(0,0,0,0.42), inset 0 1px 0 rgba(255,255,255,0.04)"
                      : "inset 0 1px 0 rgba(255,255,255,0.02)",
                  opacity: inactive && !isActive ? 0.62 : 1,
                  transition: "background 0.35s ease, border-color 0.35s ease, box-shadow 0.35s ease, opacity 0.35s ease",
                }}
              >
                <div
                  style={{
                    color: TOKENS.text,
                    fontSize: isOp ? 15 : 13,
                    fontWeight: isOp ? 650 : 590,
                    lineHeight: 1.18,
                  }}
                >
                  <span style={{ color: "rgba(255,255,255,0.22)", marginRight: 6 }}>—</span>
                  {title}
                </div>
                <p style={{ margin: "5px 0 0 0", color: TOKENS.muted, fontSize: isOp ? 12 : 11, lineHeight: 1.45 }}>{body}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
