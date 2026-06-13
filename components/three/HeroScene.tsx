"use client";

/**
 * "The Governed Lattice" — a slowly rotating wireframe node-network that extends
 * the drafting identity (ink nodes + a single redline signal) into 3D. Elegant,
 * abstract, and cheap (points + line segments). Client-only; mounted lazily and
 * only on capable desktops (see HeroSceneLazy + the hero section's mount logic).
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { AdaptiveDpr } from "@react-three/drei";
import * as THREE from "three";
import { gsap, ScrollTrigger } from "@/components/motion/registerGsap";

// Brand palette as flat hex (the scene sits on the warm --paper background via
// alpha:true; fog is paper-coloured so distant nodes fade into the page).
const INK = "#2a2620";
const REDLINE = "#c43d2a";
const PAPER = "#f3efe7";

const N = 60; // node count
const R = 2.2; // sphere radius
const K = 3; // nearest-neighbour edges per node

function fibSphere(count: number, radius: number) {
  const phi = Math.PI * (3 - Math.sqrt(5));
  return Array.from({ length: count }, (_, i) => {
    const y = 1 - (i / (count - 1)) * 2;
    const rad = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = phi * i;
    return new THREE.Vector3(Math.cos(theta) * rad, y, Math.sin(theta) * rad).multiplyScalar(radius);
  });
}

function geomFrom(values: number[]) {
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(values, 3));
  return g;
}

function buildLattice() {
  const pts = fibSphere(N, R);
  const isGov = (i: number) => i % 9 === 0; // a sparse "governance" subset

  // nearest-neighbour edges (deduped)
  const seen = new Set<string>();
  const edges: Array<[number, number]> = [];
  for (let i = 0; i < N; i++) {
    const nearest = pts
      .map((p, j) => ({ j, d: p.distanceToSquared(pts[i]) }))
      .filter((o) => o.j !== i)
      .sort((a, b) => a.d - b.d);
    for (let k = 0; k < K; k++) {
      const j = nearest[k].j;
      const key = i < j ? `${i}-${j}` : `${j}-${i}`;
      if (!seen.has(key)) {
        seen.add(key);
        edges.push([Math.min(i, j), Math.max(i, j)]);
      }
    }
  }

  const inkNodes: number[] = [];
  const redNodes: number[] = [];
  pts.forEach((p, i) => (isGov(i) ? redNodes : inkNodes).push(p.x, p.y, p.z));

  const inkLines: number[] = [];
  const redLines: number[] = [];
  edges.forEach(([a, b]) => {
    const arr = isGov(a) || isGov(b) ? redLines : inkLines;
    arr.push(pts[a].x, pts[a].y, pts[a].z, pts[b].x, pts[b].y, pts[b].z);
  });

  return {
    inkNodes: geomFrom(inkNodes),
    redNodes: geomFrom(redNodes),
    inkLines: geomFrom(inkLines),
    redLines: geomFrom(redLines),
  };
}

function Lattice({ progress }: { progress: React.RefObject<number> }) {
  const group = useRef<THREE.Group>(null);
  const inkLineMat = useRef<THREE.LineBasicMaterial>(null);
  const redLineMat = useRef<THREE.LineBasicMaterial>(null);
  const inkPtMat = useRef<THREE.PointsMaterial>(null);
  const redPtMat = useRef<THREE.PointsMaterial>(null);

  const geo = useMemo(buildLattice, []);

  // dispose generated geometries on unmount
  useEffect(() => {
    return () => {
      geo.inkNodes.dispose();
      geo.redNodes.dispose();
      geo.inkLines.dispose();
      geo.redLines.dispose();
    };
  }, [geo]);

  useFrame((state, delta) => {
    const g = group.current;
    if (!g) return;
    const d = Math.min(delta, 0.05); // clamp after tab-away

    // continuous slow drift + pointer parallax
    g.rotation.y += d * 0.06;
    g.rotation.x = THREE.MathUtils.lerp(g.rotation.x, 0.12 + state.pointer.y * 0.22, 0.04);
    g.rotation.z = THREE.MathUtils.lerp(g.rotation.z, state.pointer.x * 0.05, 0.04);

    // scroll handoff: expand + dissolve as the hero scrolls away
    const p = progress.current ?? 0;
    g.scale.setScalar(1 + p * 0.5);
    const op = Math.max(0, 1 - p * 1.15);
    if (inkLineMat.current) inkLineMat.current.opacity = 0.5 * op;
    if (redLineMat.current) redLineMat.current.opacity = 0.9 * op;
    if (inkPtMat.current) inkPtMat.current.opacity = 0.95 * op;
    if (redPtMat.current) redPtMat.current.opacity = op;
  });

  return (
    <group ref={group} rotation={[0.12, 0, 0]}>
      <lineSegments geometry={geo.inkLines}>
        <lineBasicMaterial ref={inkLineMat} color={INK} transparent opacity={0.5} />
      </lineSegments>
      <lineSegments geometry={geo.redLines}>
        <lineBasicMaterial ref={redLineMat} color={REDLINE} transparent opacity={0.9} />
      </lineSegments>
      <points geometry={geo.inkNodes}>
        <pointsMaterial ref={inkPtMat} color={INK} size={0.07} sizeAttenuation transparent opacity={0.95} />
      </points>
      <points geometry={geo.redNodes}>
        <pointsMaterial ref={redPtMat} color={REDLINE} size={0.12} sizeAttenuation transparent opacity={1} />
      </points>
    </group>
  );
}

export default function HeroScene() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const progress = useRef(0);
  const [active, setActive] = useState(true);

  // Pause the render loop entirely when the hero scrolls offscreen.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setActive(entry.isIntersecting), {
      threshold: 0.01,
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Scroll-scrubbed handoff value (desktop, motion-OK only).
  useEffect(() => {
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const st = ScrollTrigger.create({
        trigger: wrapRef.current ?? undefined,
        start: "top top",
        end: "bottom top",
        scrub: true,
        onUpdate: (self) => {
          progress.current = self.progress;
        },
      });
      return () => st.kill();
    });
    return () => mm.revert();
  }, []);

  return (
    <div ref={wrapRef} aria-hidden className="absolute inset-0">
      <Canvas
        frameloop={active ? "always" : "never"}
        dpr={[1, 1.75]}
        camera={{ position: [0, 0, 7], fov: 45 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        style={{ background: "transparent" }}
      >
        <fog attach="fog" args={[PAPER, 5, 13]} />
        <Lattice progress={progress} />
        <AdaptiveDpr pixelated={false} />
      </Canvas>
    </div>
  );
}
