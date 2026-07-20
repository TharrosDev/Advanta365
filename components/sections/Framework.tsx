import Chapter from "@/components/ui/Chapter";
import SplitText from "@/components/ui/SplitText";
import { framework } from "@/lib/content";

/**
 * Chapter 02 — the operating model and its four principles. Server component.
 */
export default function Framework() {
  return (
    <Chapter
      id="framework"
      index={framework.index}
      word={framework.word}
      kicker={framework.kicker}
      className="bg-dots"
    >
      <p className="ch-h">
        <SplitText text={framework.heading} />
      </p>
      <p data-reveal className="t-lead measure-wide mt-6">
        {framework.lede}
      </p>

      <div className="cell-grid ch-gap" data-reveal-group>
        {framework.principles.map((p, i) => (
          <article key={p.title} data-reveal className="cell">
            <span className="cell-num">
              PRN-{String(i + 1).padStart(2, "0")}
            </span>
            <h3 className="t-h3">{p.title}</h3>
            <p className="t-body text-ink-muted">{p.body}</p>
          </article>
        ))}
      </div>
    </Chapter>
  );
}
