"use client";

import { useEffect, useRef } from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { delivery } from "@/lib/content";
import SectionHeading from "@/components/ui/SectionHeading";

/**
 * The delivery sequence — the site's centerpiece scroll moment. On large
 * screens the section pins and the six stages travel horizontally under a
 * filling cobalt progress rail, so the visitor physically scrubs through the
 * path the framework describes. Everywhere else (small screens, no JS,
 * reduced motion) the stages read as a vertical ledger: the pin is opt-in
 * and additive, and a failure while wiring it simply leaves the ledger.
 */
export default function Delivery() {
  const sectionRef = useRef<HTMLElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLOListElement>(null);
  const fillRef = useRef<HTMLSpanElement>(null);
  const countRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const section = sectionRef.current;
    const viewport = viewportRef.current;
    const track = trackRef.current;
    if (!section || !viewport || !track) return;

    const mm = gsap.matchMedia();

    mm.add("(min-width: 1024px) and (min-height: 720px)", () => {
      const panels = Array.from(
        track.querySelectorAll<HTMLElement>(".dlv-panel"),
      );
      const setActive = (idx: number) => {
        panels.forEach((p, i) => p.classList.toggle("is-active", i === idx));
      };

      section.classList.add("is-pinned");
      track.classList.add("is-horizontal");
      setActive(0);

      // In pinned mode the panels present through the horizontal scrub, not
      // the entrance reveal — and a fast scroll-jump past the pin can outrace
      // the scrubbed track so IntersectionObserver never sees the later
      // panels, leaving them at opacity 0 forever. Force them visible here.
      gsap.set(panels, { opacity: 1, x: 0, y: 0, scale: 1 });

      try {
        const dist = () =>
          Math.max(
            0,
            track.scrollWidth - (track.parentElement?.clientWidth ?? 0),
          );

        const tween = gsap.to(track, {
          x: () => -dist(),
          ease: "none",
          scrollTrigger: {
            trigger: viewport,
            start: "top top",
            end: () => `+=${Math.max(dist(), 1)}`,
            pin: true,
            scrub: 0.5,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            onUpdate: (self) => {
              if (fillRef.current) {
                fillRef.current.style.transform = `scaleX(${self.progress})`;
              }
              const idx = Math.min(
                panels.length - 1,
                Math.round(self.progress * (panels.length - 1)),
              );
              setActive(idx);
              if (countRef.current) {
                countRef.current.textContent = `${String(idx + 1).padStart(2, "0")} / ${String(panels.length).padStart(2, "0")}`;
              }
            },
          },
        });

        return () => {
          tween.scrollTrigger?.kill();
          tween.kill();
          gsap.set(track, { clearProps: "x" });
          panels.forEach((p) => p.classList.remove("is-active"));
          section.classList.remove("is-pinned");
          track.classList.remove("is-horizontal");
        };
      } catch {
        // Wiring failed: fall back to the static vertical ledger.
        section.classList.remove("is-pinned");
        track.classList.remove("is-horizontal");
      }
    });

    return () => mm.revert();
  }, []);

  return (
    <section ref={sectionRef} id="delivery" className="rule-top band-3">
      <div ref={viewportRef} className="dlv-viewport pad-block-xl">
        <div className="u-container">
          <div className="grid gap-8 md:grid-cols-12 md:gap-16">
            <SectionHeading
              className="md:col-span-6"
              index={delivery.index}
              kicker={delivery.kicker}
              heading={delivery.heading}
            />
            <div className="md:col-span-6 md:self-end">
              <p data-reveal className="t-lead measure-wide">
                {delivery.lede}
              </p>
            </div>
          </div>

          <div className="section-gap">
            <div className="dlv-progress" aria-hidden="true">
              <span className="dlv-progress-count" ref={countRef}>
                01 / {String(delivery.stages.length).padStart(2, "0")}
              </span>
              <span className="dlv-progress-rail">
                <span className="dlv-progress-fill" ref={fillRef} />
              </span>
            </div>

            <ol ref={trackRef} className="dlv-track">
              {delivery.stages.map((stage, i) => (
                <li key={stage.num} data-reveal className="dlv-panel">
                  <span className="dlv-key" aria-hidden="true">
                    {stage.num}
                  </span>
                  <div className="flex flex-col gap-3">
                    <span className="dlv-stage-num">
                      Stage {stage.num} / {String(delivery.stages.length).padStart(2, "0")}
                    </span>
                    <h3 className="dlv-stage-name">{stage.name}</h3>
                    <p className="t-body measure text-bone-muted">{stage.body}</p>
                  </div>
                </li>
              ))}
            </ol>

            <p data-reveal className="t-coord mt-10 !text-cobalt-hot">
              {delivery.note}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
