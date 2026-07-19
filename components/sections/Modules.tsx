import SectionHeading from "@/components/ui/SectionHeading";
import { registry } from "@/lib/content";

/**
 * The registry: five modules as full-bleed editorial rows with a cobalt
 * hover flood. Server component.
 */
export default function Modules() {
  return (
    <section id="modules" className="rule-top">
      <div className="u-container pad-block-2xl">
        <div className="grid gap-8 md:grid-cols-12 md:gap-16">
          <SectionHeading
            className="md:col-span-7"
            index={registry.index}
            kicker={registry.kicker}
            heading={registry.heading}
          />
          <div className="md:col-span-5 md:self-end">
            <p data-reveal className="t-lead">
              {registry.lede}
            </p>
          </div>
        </div>

        <ul className="section-gap" data-reveal-group>
          {registry.modules.map((mod) => (
            <li key={mod.code} data-reveal className="mod-row">
              <span className="mod-code">{mod.code}</span>
              <h3 className="mod-title t-h3 uppercase">{mod.title}</h3>
              <p className="mod-body">{mod.body}</p>
              <span className="mod-tag chip">{mod.tag}</span>
              <span className="mod-arrow" aria-hidden="true">
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                  <path
                    d="M4 11h14m0 0-5.5-5.5M18 11l-5.5 5.5"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
