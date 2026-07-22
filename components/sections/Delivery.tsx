"use client";

import { useEffect, useRef } from "react";
import Sheet from "@/components/ui/Sheet";
import { delivery } from "@/lib/content";

/**
 * Sheet 03 — the six delivery stages as a drawn flow-track. A connector spine
 * runs down the marker column; the row nearest the viewport centre lights its
 * node (IntersectionObserver, additive — without JS every row simply renders
 * with an open node dot and all text stays readable).
 */
export default function Delivery() {
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const rows = Array.from(list.querySelectorAll<HTMLElement>(".flow-row"));
    if (!rows.length) return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          (entry.target as HTMLElement).classList.toggle(
            "is-active",
            entry.isIntersecting,
          );
        }
      },
      { rootMargin: "-42% 0px -42% 0px", threshold: 0 },
    );
    rows.forEach((r) => io.observe(r));
    return () => io.disconnect();
  }, []);

  return (
    <Sheet
      id="delivery"
      refNo={delivery.index}
      kicker={delivery.kicker}
      title={delivery.heading}
      lede={delivery.lede}
      className="band-3"
    >
      <div ref={listRef} className="flow" data-reveal-group>
        {delivery.stages.map((stage) => (
          <div key={stage.num} data-reveal className="flow-row">
            <div className="flow-marker" aria-hidden="true">
              <span className="flow-dot" />
            </div>
            <div className="flex flex-col gap-2">
              <span className="flow-stage">Stage {stage.num}</span>
              <h3 className="flow-name">{stage.name}</h3>
              <p className="flow-body">{stage.body}</p>
            </div>
          </div>
        ))}
      </div>

      <p data-reveal className="annot section-gap max-w-2xl !tracking-[0.14em]">
        {delivery.note}
      </p>
    </Sheet>
  );
}
