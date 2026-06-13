"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/components/motion/registerGsap";
import { stats } from "@/lib/content";

export default function ProofStrip() {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const nums = gsap.utils.toArray<HTMLElement>("[data-count]");
        nums.forEach((el) => {
          const target = Number(el.dataset.count ?? "0");
          const obj = { v: 0 };
          el.textContent = "0";
          gsap.to(obj, {
            v: target,
            duration: 1.1,
            ease: "power2.out",
            scrollTrigger: { trigger: el, start: "top 88%", once: true },
            onUpdate: () => {
              el.textContent = String(Math.round(obj.v));
            },
          });
        });
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section className="border-b border-rule-strong bg-background">
      <div className="container py-8 md:py-10">
        <div
          ref={root}
          className="grid divide-y divide-rule sm:grid-cols-3 sm:divide-x sm:divide-y-0"
        >
          {stats.map((stat, idx) => (
            <div
              key={idx}
              className="flex items-baseline gap-4 py-5 sm:flex-col sm:items-start sm:gap-3 sm:px-6 sm:py-2 sm:first:pl-0"
            >
              <span
                data-count={stat.number}
                className="figure-index text-[clamp(2.25rem,1.4rem+2.6vw,3.25rem)] leading-none tabular-nums"
              >
                {stat.number}
              </span>
              <span className="body-base max-w-[22ch] text-ink-2">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
