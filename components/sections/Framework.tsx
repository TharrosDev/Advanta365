import SectionHeading from "@/components/ui/SectionHeading";
import { framework } from "@/lib/content";

/**
 * What ADVANTA365 is: the operating model and its four principles in a
 * keyline cell grid. Server component.
 */
export default function Framework() {
  return (
    <section id="framework" className="rule-top bg-dots">
      <div className="u-container pad-block-2xl">
        <div className="grid gap-8 md:grid-cols-12 md:gap-16">
          <SectionHeading
            className="md:col-span-7"
            index={framework.index}
            kicker={framework.kicker}
            heading={framework.heading}
          />
          <div className="md:col-span-5 md:self-end">
            <p data-reveal className="t-lead">
              {framework.lede}
            </p>
          </div>
        </div>

        <div className="cell-grid section-gap" data-reveal-group>
          {framework.principles.map((p, i) => (
            <article key={p.title} data-reveal className="cell">
              <span className="cell-num">
                PRN-{String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="t-h3">{p.title}</h3>
              <p className="t-body text-bone-muted">{p.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
