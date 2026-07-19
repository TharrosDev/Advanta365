import SectionHeading from "@/components/ui/SectionHeading";
import Counter from "@/components/fx/Counter";
import { adoption } from "@/lib/content";

/**
 * The human layer: framework counters, four role tracks, and the adoption
 * checklist. Server component; the counters replay client-side.
 */
export default function Adoption() {
  return (
    <section id="adoption" className="rule-top">
      <div className="u-container pad-block-2xl">
        <div className="grid gap-8 md:grid-cols-12 md:gap-16">
          <SectionHeading
            className="md:col-span-7"
            index={adoption.index}
            kicker={adoption.kicker}
            heading={adoption.heading}
          />
          <div className="md:col-span-5 md:self-end">
            <p data-reveal className="t-lead">
              {adoption.lede}
            </p>
          </div>
        </div>

        <div
          className="section-gap grid rule-top rule-bottom md:grid-cols-3"
          data-reveal-group
        >
          {adoption.stats.map((s) => (
            <div key={s.label} data-reveal className="stat-cell">
              <span className="stat-num">
                <Counter value={s.value} />
              </span>
              <span className="t-coord">{s.label}</span>
            </div>
          ))}
        </div>

        <div className="section-gap grid gap-10 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-7">
            <h3 data-reveal className="t-coord mb-6">
              Role-based tracks
            </h3>
            <div className="grid gap-px border border-line bg-line sm:grid-cols-2" data-reveal-group>
              {adoption.tracks.map((track) => (
                <article key={track.num} data-reveal className="track-cell">
                  <span className="track-num" aria-hidden="true">
                    {track.num}
                  </span>
                  <h4 className="t-h3">{track.title}</h4>
                  <p className="t-body text-bone-muted">{track.body}</p>
                </article>
              ))}
            </div>
          </div>

          <div className="lg:col-span-5">
            <h3 data-reveal className="t-coord mb-6">
              What makes it stick
            </h3>
            <ul data-reveal-group>
              {adoption.factors.map((f) => (
                <li key={f} data-reveal className="check-item">
                  <span className="check-box" aria-hidden="true">
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path
                        d="M1.5 5.5 4 8l4.5-6"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
