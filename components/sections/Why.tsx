import SectionHeading from "@/components/ui/SectionHeading";
import TextScrub from "@/components/fx/TextScrub";
import { why } from "@/lib/content";

/**
 * Why ADVANTA365: the position statement and four differentiators as
 * ruled rows. Server component.
 */
export default function Why() {
  return (
    <section id="why" className="rule-top band-3">
      <div className="u-container pad-block-2xl">
        <SectionHeading index={why.index} kicker={why.kicker} heading={why.heading} />

        <div className="section-gap">
          <TextScrub text={why.statement} className="t-lead measure-wide" />
        </div>

        <ul className="section-gap rule-top" data-reveal-group>
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
      </div>
    </section>
  );
}
