import Chapter from "@/components/ui/Chapter";
import SplitText from "@/components/ui/SplitText";
import TextScrub from "@/components/fx/TextScrub";
import { problem } from "@/lib/content";

/**
 * Chapter 01 — the failure state: incident cards scrolling past the rail,
 * closed by a scroll-scrubbed statement. Server component.
 */
export default function Problem() {
  return (
    <Chapter
      id="problem"
      index={problem.index}
      word={problem.word}
      kicker={problem.kicker}
      className="band-2"
    >
      <p className="ch-h">
        <SplitText text={problem.heading} />
      </p>
      <p data-reveal className="t-lead measure-wide mt-6">
        {problem.lede}
      </p>

      <ul className="ch-gap flex flex-col gap-4" data-reveal-group>
        {problem.incidents.map((inc) => (
          <li key={inc.code} data-reveal className="inc-card">
            <div className="inc-card-top">
              <span className="inc-code">{inc.code}</span>
              <span className="inc-flag">Unresolved</span>
            </div>
            <h3 className="inc-title">{inc.title}</h3>
            <p className="inc-body">{inc.body}</p>
          </li>
        ))}
      </ul>

      <div className="ch-gap">
        <TextScrub
          text={problem.statement}
          className="t-h2 measure-statement"
        />
      </div>
    </Chapter>
  );
}
