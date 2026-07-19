import SectionHeading from "@/components/ui/SectionHeading";
import TextScrub from "@/components/fx/TextScrub";
import { problem } from "@/lib/content";

/**
 * The failure state: an incident ledger of the three ways Microsoft 365
 * programs die, closed by a scroll-scrubbed statement. Server component.
 */
export default function Problem() {
  return (
    <section id="problem" className="rule-top band-2">
      <div className="u-container pad-block-2xl">
        <div className="grid gap-8 md:grid-cols-12 md:gap-16">
          <SectionHeading
            className="md:col-span-6"
            index={problem.index}
            kicker={problem.kicker}
            heading={problem.heading}
          />
          <div className="md:col-span-6 md:self-end">
            <p data-reveal className="t-lead measure-wide">
              {problem.lede}
            </p>
          </div>
        </div>

        <ul className="section-gap" data-reveal-group>
          {problem.incidents.map((inc) => (
            <li key={inc.code} data-reveal className="inc-row">
              <span className="inc-code">{inc.code}</span>
              <h3 className="inc-title">{inc.title}</h3>
              <p className="inc-body">{inc.body}</p>
              <span className="inc-flag">Unresolved</span>
            </li>
          ))}
        </ul>

        <div className="section-gap-lg">
          <TextScrub
            text={problem.statement}
            className="t-h2 measure-statement"
          />
        </div>
      </div>
    </section>
  );
}
