import type { ReactNode } from "react";
import ChapterRail from "@/components/ui/ChapterRail";

type Props = {
  id: string;
  index: string;
  word: string;
  kicker: string;
  className?: string;
  children: ReactNode;
};

/**
 * A dossier chapter: the site's core layout unit. Sticky rail on the left
 * (index, word, kicker, progress), scrolling content on the right. Server
 * component — only the rail's progress line is client-side.
 */
export default function Chapter({ id, index, word, kicker, className, children }: Props) {
  return (
    <section id={id} className={`ch${className ? ` ${className}` : ""}`}>
      <div className="ch-rail">
        <ChapterRail index={index} word={word} kicker={kicker} />
      </div>
      <div className="ch-body">{children}</div>
    </section>
  );
}
