"use client";

import { motion, useReducedMotion } from "framer-motion";

const flowSteps = [
  { id: "cancelled", label: "Cancelled" },
  { id: "matched", label: "Matched" },
  { id: "claimed", label: "Claimed" },
  { id: "confirmed", label: "Confirmed" },
] as const;

export function HeroRecoveryScene() {
  const reduce = useReducedMotion();

  return (
    <div className="ms-hero-recovery-scene" aria-label="Example recovery moment in PulseFill">
      <div className="ms-hero-scene-bg" aria-hidden />

      <svg className="ms-hero-flow-svg" viewBox="0 0 520 420" preserveAspectRatio="none" aria-hidden>
        <defs>
          <linearGradient id="msHeroFlowGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(255,122,24,0.15)" />
            <stop offset="45%" stopColor="rgba(255,186,120,0.85)" />
            <stop offset="100%" stopColor="rgba(90,209,138,0.55)" />
          </linearGradient>
        </defs>
        <path
          className={reduce ? "" : "ms-hero-flow-path"}
          d="M 42 118 C 120 118, 140 200, 200 228 S 320 248, 400 268"
          fill="none"
          stroke="url(#msHeroFlowGrad)"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeDasharray="8 10"
          opacity={reduce ? 0.45 : 0.9}
        />
      </svg>

      <div className="ms-hero-scene-stack">
        <motion.div
          className="ms-hero-float-card"
          initial={false}
          animate={reduce ? {} : { y: [0, -5, 0] }}
          transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <p className="ms-hero-float-kicker">Customer update</p>
          <p className="ms-hero-float-title">Dental cleaning</p>
          <p className="ms-hero-float-meta">Today · 2:30 PM</p>
          <p className="ms-hero-float-highlight">Maya claimed this spot</p>
          <span className="ms-hero-pill ms-hero-pill--success">Claimed</span>
        </motion.div>

        <div className="ms-hero-main-card">
          <div className="ms-hero-main-glow" aria-hidden />
          <p className="ms-hero-main-kicker">Today&apos;s recovery</p>
          <div className="ms-hero-main-head">
            <p className="ms-hero-main-label">Cancelled appointment</p>
            <p className="ms-hero-main-title">Dental cleaning · 2:30 PM</p>
          </div>

          <ul className="ms-hero-story-lines">
            <li>
              <span className="ms-hero-story-key">9 waiting customers matched</span>
            </li>
            <li>
              <span className="ms-hero-story-key">3 offers sent</span>
            </li>
            <li>
              <span className="ms-hero-story-key ms-hero-story-key--ember">1 claim received</span>
            </li>
            <li>
              <span className="ms-hero-story-key ms-hero-story-key--green">$185 recovered</span>
            </li>
          </ul>

          <div className="ms-hero-flow-dots" role="presentation">
            {flowSteps.map((s, i) => (
              <span key={s.id} className="ms-hero-flow-dot-wrap">
                <span className={`ms-hero-flow-dot ms-hero-flow-dot--${i}`} />
                <span className="ms-hero-flow-dot-label">{s.label}</span>
              </span>
            ))}
          </div>

          <button type="button" className="ms-hero-confirm-btn">
            Confirm booking
          </button>
        </div>

        <motion.div
          className="ms-hero-recovered-badge"
          initial={false}
          animate={reduce ? {} : { scale: [1, 1.02, 1] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
        >
          <p className="ms-hero-badge-kicker">Recovered</p>
          <p className="ms-hero-badge-amount">$185</p>
          <p className="ms-hero-badge-meta">in 3 min</p>
        </motion.div>
      </div>
    </div>
  );
}
