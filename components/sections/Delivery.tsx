"use client";

import { useEffect, useRef } from "react";
import Chapter from "@/components/ui/Chapter";
import SplitText from "@/components/ui/SplitText";
import { delivery } from "@/lib/content";

/**
 * Chapter 03 — the six delivery stages as a vertical ledger scrolling past
 * the pinned rail. The row nearest the viewport centre lights its numeral
 * in cobalt (IntersectionObserver, additive: without JS every numeral is
 * stroked and everything stays readable).
 */
export default function Delivery() {
  const listRef = useRef<HTMLOListElement>(null);

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const rows = Array.from(list.querySelectorAll<HTMLElement>(".stg-row"));
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
      // A band around the viewport centre.
      { rootMargin: "-38% 0px -38% 0px", threshold: 0 },
    );
    rows.forEach((r) => io.observe(r));
    return () => io.disconnect();
  }, []);

  return (
    <Chapter
      id="delivery"
      index={delivery.index}
      word={delivery.word}
      kicker={delivery.kicker}
      className="band-3"
    >
      <p className="ch-h">
        <SplitText text={delivery.heading} />
      </p>
      <p data-reveal className="t-lead measure-wide mt-6">
        {delivery.lede}
      </p>

      <ol ref={listRef} className="ch-gap" data-reveal-group>
        {delivery.stages.map((stage) => (
          <li key={stage.num} data-reveal className="stg-row">
            <span className="stg-num" aria-hidden="true">
              {stage.num}
            </span>
            <div className="flex flex-col gap-2">
              <h3 className="stg-name">{stage.name}</h3>
              <p className="stg-body">{stage.body}</p>
            </div>
          </li>
        ))}
      </ol>

      <p data-reveal className="t-coord mt-8 !text-cobalt-deep">
        {delivery.note}
      </p>
    </Chapter>
  );
}
