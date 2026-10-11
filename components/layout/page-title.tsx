import type { ReactNode } from "react";

import { SheenWord } from "@/components/graphics/sheen-text/sheen-text";
import { Reveal } from "@/components/motion/reveal";
import { Container } from "@/components/ui/container";
import { cx } from "@/lib/cx";
import { splitWords } from "@/lib/motion/words";

import styles from "./page-title.module.css";

type TitlePart = { text: string; wordIndex: number | null };

/** Tokens of the title in order; words carry their stagger index, whitespace carries null. */
function titleParts(title: string): { parts: TitlePart[]; wordCount: number } {
  const parts: TitlePart[] = [];
  let wordCount = 0;
  for (const token of splitWords(title)) {
    if (token.kind === "space") {
      parts.push({ text: token.text, wordIndex: null });
    } else {
      parts.push({ text: token.text, wordIndex: wordCount });
      wordCount += 1;
    }
  }
  return { parts, wordCount };
}

function hasContent(node: ReactNode): boolean {
  return node !== null && node !== undefined && node !== false && node !== "";
}

/**
 * The title block that opens every inner page: optional eyebrow, the page's ONLY `<h1>`, an
 * optional lead and extra content. The h1 is split into words that rise 50ms apart; each word
 * carries the sheen effect unless `sheen` is off. `h1.textContent` is exactly `title`.
 */
export function PageTitle({
  title,
  lead,
  eyebrow,
  sheen = true,
  ruled = true,
  children,
  className,
}: {
  title: string;
  lead?: ReactNode;
  eyebrow?: ReactNode;
  sheen?: boolean;
  ruled?: boolean;
  children?: ReactNode;
  className?: string;
}) {
  const { parts, wordCount } = titleParts(title);
  // The lead follows the heading: coarse index max(2, words - 1); extra content one step later.
  const leadIndex = Math.max(2, wordCount - 1);

  return (
    <Container className={className}>
      <div className={cx(styles.inner, ruled && "ruled")}>
        {hasContent(eyebrow) && (
          <Reveal as="div" effect="fade" index={0} className={styles.eyebrow}>
            {eyebrow}
          </Reveal>
        )}
        <h1 className={cx("t-display-fluid", styles.title)}>
          {parts.map((part, position) =>
            part.wordIndex === null ? (
              part.text
            ) : (
              <Reveal key={position} effect="rise" step="fine" index={part.wordIndex}>
                {sheen ? <SheenWord>{part.text}</SheenWord> : part.text}
              </Reveal>
            ),
          )}
        </h1>
        {hasContent(lead) && (
          <p className={cx("t-body-large c-fg-60", styles.body)}>
            <Reveal effect="fade" index={leadIndex}>
              {lead}
            </Reveal>
          </p>
        )}
        {hasContent(children) && (
          <Reveal as="div" effect="fade-up" index={leadIndex + 1}>
            {children}
          </Reveal>
        )}
      </div>
    </Container>
  );
}
