import SectionHeading from "@/components/ui/SectionHeading";
import { platforms } from "@/lib/content";

/**
 * The surface: SharePoint, Teams, OneDrive as keyline columns that invert
 * to bone on hover. Server component.
 */
export default function Platforms() {
  return (
    <section id="platforms" className="rule-top band-2">
      <div className="u-container pad-block-2xl">
        <div className="grid gap-8 md:grid-cols-12 md:gap-16">
          <SectionHeading
            className="md:col-span-7"
            index={platforms.index}
            kicker={platforms.kicker}
            heading={platforms.heading}
          />
          <div className="md:col-span-5 md:self-end">
            <p data-reveal className="t-lead">
              {platforms.lede}
            </p>
          </div>
        </div>

        <div className="plat-grid section-gap" data-reveal-group>
          {platforms.items.map((p) => (
            <article key={p.name} data-reveal className="plat-cell">
              <h3 className="plat-name">{p.name}</h3>
              <p className="plat-role t-body">{p.role}</p>
              <ul className="mt-auto pt-4">
                {p.themes.map((t) => (
                  <li key={t} className="plat-theme">
                    {t}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
