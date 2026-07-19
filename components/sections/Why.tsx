import Chapter from "@/components/ui/Chapter";
import SplitText from "@/components/ui/SplitText";
import TextScrub from "@/components/fx/TextScrub";
import { why } from "@/lib/content";

/**
 * Chapter 07 — the position: statement plus four differentiator rows.
 * Server component.
 */
export default function Why() {
  return (
    <Chapter
      id="why"
      index={why.index}
      word={why.word}
      kicker={why.kicker}
      className="band-3"
    >
      <p className="ch-h">
        <SplitText text={why.heading} />
      </p>

      <div className="mt-8">
        <TextScrub text={why.statement} className="t-lead measure-wide" />
      </div>

      <ul className="ch-gap rule-top" data-reveal-group>
        {why.reasons.map((r) => (
          <li key={r.num} data-reveal className="why-row">
            <span className="why-num" aria-hidden="true">
              {r.num}
            </span>
            <h3 className="why-title">{r.title}</h3>
            <p className="why-body">{r.body}</p>
          </li>
        ))}
      </ul>
    </Chapter>
  );
}
