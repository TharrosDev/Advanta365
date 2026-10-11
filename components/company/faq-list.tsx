"use client";

import { useId, useState } from "react";
import { Reveal } from "@/components/motion/reveal";
import { RevealGroup } from "@/components/motion/reveal-group";
import { ArrowIcon } from "@/components/ui/arrow-icon";
import { cx } from "@/lib/cx";
import styles from "./faq-list.module.css";

export type FaqItem = { question: string; answer: string };

/**
 * A list of questions that open in place. Any number of items can be open at once: the open ones
 * are kept as a list of indices and a click toggles one of them. A closed answer is `inert`, so it
 * is out of the tab order and the accessibility tree while it is collapsed.
 *
 * The items fade up in turn once the list scrolls into view (it is its own reveal group).
 */
export function FaqList({ items, className }: { items: readonly FaqItem[]; className?: string }) {
  const baseId = useId();
  const [open, setOpen] = useState<readonly number[]>([]);

  const toggle = (index: number) => {
    setOpen((current) =>
      current.includes(index) ? current.filter((i) => i !== index) : [...current, index],
    );
  };

  const anyOpen = open.length > 0;

  return (
    <RevealGroup as="ul" className={cx(styles.list, className)}>
      {items.map((item, index) => {
        const isOpen = open.includes(index);
        const panelId = `${baseId}-panel-${index}`;
        return (
          <Reveal
            key={item.question}
            as="li"
            effect="fade-up"
            index={index}
            className={styles.item}
            data-open={isOpen ? "true" : "false"}
          >
            <h3 className={styles.heading}>
              <button
                type="button"
                className={cx(
                  "t-headline-small",
                  styles.trigger,
                  anyOpen && !isOpen && styles.dimmed,
                )}
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => toggle(index)}
              >
                <span className={styles.question}>{item.question}</span>
                <span className={styles.arrow} aria-hidden="true">
                  <ArrowIcon direction="right" size={24} />
                </span>
              </button>
            </h3>
            <div id={panelId} className={styles.panel} inert={!isOpen}>
              <div className={styles.panelInner}>
                <div className={styles.panelContent}>
                  <p className={cx("t-body-large", "c-fg-60", styles.answer)}>{item.answer}</p>
                </div>
              </div>
            </div>
          </Reveal>
        );
      })}
    </RevealGroup>
  );
}
