"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Suspense, useRef } from "react";
import * as THREE from "three";

/** Subtle ember + tension planes — atmosphere only, not spectacle. */
function SignalField() {
  const group = useRef<THREE.Group>(null);
  useFrame((s) => {
    if (!group.current) return;
    const t = s.clock.elapsedTime;
    group.current.rotation.z = Math.sin(t * 0.12) * 0.025;
    group.current.position.x = Math.sin(t * 0.08) * 0.06;
  });

  return (
    <group ref={group}>
      <mesh position={[1.4, 0.15, -3.2]} rotation={[0, 0, -0.12]}>
        <planeGeometry args={[16, 11, 1, 1]} />
        <meshBasicMaterial
          color="#ff7a18"
          transparent
          opacity={0.065}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <mesh position={[-1, -0.35, -4.2]} rotation={[0, 0, 0.1]}>
        <planeGeometry args={[20, 14, 1, 1]} />
        <meshBasicMaterial
          color="#9e2a1f"
          transparent
          opacity={0.05}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}

export function HeroAtmosphere() {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
        opacity: 0.95,
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 6.5], fov: 40 }}
        gl={{
          alpha: true,
          antialias: true,
          powerPreference: "high-performance",
        }}
        dpr={[1, 1.5]}
        style={{ width: "100%", height: "100%" }}
      >
        <Suspense fallback={null}>
          <SignalField />
        </Suspense>
      </Canvas>
    </div>
  );
}
