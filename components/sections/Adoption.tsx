import Sheet from "@/components/ui/Sheet";
import Counter from "@/components/fx/Counter";
import { adoption } from "@/lib/content";

/**
 * Sheet 06 — the human layer: framework counters, four role swimlanes, and
 * the adoption checklist. Server component; counters replay client-side.
 */
export default function Adoption() {
  return (
    <Sheet
      id="adoption"
      refNo={adoption.index}
      kicker={adoption.kicker}
      title={adoption.heading}
      lede={adoption.lede}
    >
      <div
        className="grid rounded-[3px] border border-line bg-card sm:grid-cols-3"
        data-reveal-group
      >
        {adoption.stats.map((s) => (
          <div key={s.label} data-reveal className="stat-cell">
            <span className="stat-num">
              <Counter value={s.value} />
            </span>
            <span className="annot annot-ink">{s.label}</span>
          </div>
        ))}
      </div>

      <div className="section-gap">
        <h3 data-reveal className="annot mb-5">
          Role-based tracks
        </h3>
        <div
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
          data-reveal-group
        >
          {adoption.tracks.map((track) => (
            <article key={track.num} data-reveal className="lane">
              <span className="lane-track">Track {track.num}</span>
              <h4 className="lane-title">{track.title}</h4>
              <p className="lane-body t-body">{track.body}</p>
            </article>
          ))}
        </div>
      </div>

      <div className="section-gap max-w-3xl">
        <h3 data-reveal className="annot mb-3">
          What makes it stick
        </h3>
        <ul data-reveal-group>
          {adoption.factors.map((f) => (
            <li key={f} data-reveal className="check-item">
              <span className="check-box" aria-hidden="true">
                <svg width="11" height="11" viewBox="0 0 10 10" fill="none">
                  <path
                    d="M1.5 5.5 4 8l4.5-6"
                    stroke="currentColor"
                    strokeWidth="1.7"
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
    </Sheet>
  );
}
