"use client";

import { useEffect, useRef, type ElementType } from "react";
import { splitWords } from "@/lib/splitText";

type Props = {
  text: string;
  as?: ElementType;
  className?: string;
};

/**
 * Renders text server-side as plain content (crawlable, no-JS safe), then on
 * mount splits it into masked word spans. The reveal system picks up the
 * `.split-word` nodes inside `[data-split]`.
 */
export default function SplitText({ text, as: Tag = "span", className }: Props) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const result = splitWords(el);
    return () => result.revert();
  }, [text]);

  return (
    <Tag ref={ref} className={className} data-split="">
      {text}
    </Tag>
  );
}
