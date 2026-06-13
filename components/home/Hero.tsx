"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useGSAP } from "@gsap/react";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/useMobile";
import { gsap } from "@/components/motion/registerGsap";
import HeroFallback from "@/components/three/HeroFallback";
import HeroSceneLazy from "@/components/three/HeroSceneLazy";
import { heroContent } from "@/lib/content";

export default function Hero() {
  const isMobile = useIsMobile();
  const [mounted, setMounted] = useState(false);
  const [reduced, setReduced] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // SSR/first paint and any constrained context render the static fallback; the
  // 3D scene only mounts on a capable desktop with motion enabled.
  const show3D = mounted && !isMobile && !reduced;

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from("[data-hero-reveal]", {
          y: 26,
          opacity: 0,
          duration: 0.9,
          ease: "power3.out",
          stagger: 0.12,
          delay: 0.05,
        });
      });
      return () => mm.revert();
    },
    { scope: rootRef },
  );

  return (
    <section className="relative isolate overflow-hidden border-b border-rule-strong bg-background">
      <div
        aria-hidden
        className="grid-paper pointer-events-none absolute inset-0 -z-10 opacity-50"
        style={{ maskImage: "linear-gradient(to bottom, black, transparent 85%)" }}
      />
      <div
        ref={rootRef}
        className="container grid items-center gap-12 pb-16 pt-12 md:pt-16 lg:grid-cols-12 lg:gap-16 wide:pt-20"
      >
        <div className="lg:col-span-6">
          <div data-hero-reveal className="mb-6 flex items-center gap-4 border-t border-rule-strong pt-3">
            <span className="figure-index text-sm">A365</span>
            <span className="mono-label">{heroContent.subtitle}</span>
          </div>
          <h1 data-hero-reveal className="h-display text-ink">
            Microsoft 365, <span className="text-primary">governed and adopted</span> at scale.
          </h1>
          <p data-hero-reveal className="body-lg mt-6 max-w-[52ch]">
            {heroContent.description}
          </p>
          <div data-hero-reveal className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/contact">
              <Button size="lg" className="w-full gap-2 sm:w-auto">
                {heroContent.cta1}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/#framework">
              <Button size="lg" variant="outline" className="w-full gap-2 sm:w-auto">
                {heroContent.cta2}
              </Button>
            </Link>
          </div>
        </div>

        <div data-hero-reveal className="lg:col-span-6">
          <div className="relative aspect-square w-full overflow-hidden rounded-sm border border-rule bg-paper-panel sm:aspect-[5/4] lg:aspect-square">
            <div aria-hidden className="grid-paper pointer-events-none absolute inset-0 opacity-40" />
            {show3D ? <HeroSceneLazy /> : <HeroFallback />}
          </div>
          <div className="mt-3 flex items-center justify-between">
            <span className="mono-label">Fig. 01 — Governed lattice</span>
            <span className="mono-label text-primary">Governed</span>
          </div>
        </div>
      </div>
    </section>
  );
}
