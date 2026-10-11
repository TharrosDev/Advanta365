"use client";

import { useId, useState } from "react";
import { BandedList, BandedRow } from "@/components/ui/banded-list";
import { Icon } from "@/components/ui/icon";
import { cx } from "@/lib/cx";
import styles from "./faq-list.module.css";

export type FaqItem = { question: string; answer: string };

/**
 * A banded list of questions that open in place. Any number of items can be open at once: the open
 * ones are kept as a list of indices and a click toggles one of them. A closed answer is `inert`, so
 * it is out of the tab order and the accessibility tree while it is collapsed. The plus at the end
 * of a question turns into a minus when it is open, and the answer opens by growing its row from
 * zero height; an open row takes the surface tone whatever its position in the list.
 */
export function FaqList({ items, className }: { items: readonly FaqItem[]; className?: string }) {
  const baseId = useId();
  const [open, setOpen] = useState<readonly number[]>([]);

  const toggle = (index: number) => {
    setOpen((current) =>
      current.includes(index) ? current.filter((i) => i !== index) : [...current, index],
    );
  };

  return (
    <BandedList className={className}>
      {items.map((item, index) => {
        const isOpen = open.includes(index);
        const panelId = `${baseId}-panel-${index}`;
        return (
          <BandedRow
            key={item.question}
            className={styles.item}
            data-open={isOpen ? "true" : "false"}
          >
            <h3 className={styles.heading}>
              <button
                type="button"
                className={cx("type-item", styles.trigger)}
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => toggle(index)}
              >
                <span className={styles.question}>{item.question}</span>
                <Icon name={isOpen ? "minus" : "plus"} />
              </button>
            </h3>
            <div id={panelId} className={styles.panel} inert={!isOpen}>
              <div className={styles.panelInner}>
                <div className={styles.panelContent}>
                  <p className={cx("type-copy", styles.answer)}>{item.answer}</p>
                </div>
              </div>
            </div>
          </BandedRow>
        );
      })}
    </BandedList>
  );
}
