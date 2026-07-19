import Chapter from "@/components/ui/Chapter";
import SplitText from "@/components/ui/SplitText";
import Counter from "@/components/fx/Counter";
import { adoption } from "@/lib/content";

/**
 * Chapter 06 — the human layer: framework counters, role tracks, and the
 * adoption checklist. Server component; counters replay client-side.
 */
export default function Adoption() {
  return (
    <Chapter
      id="adoption"
      index={adoption.index}
      word={adoption.word}
      kicker={adoption.kicker}
    >
      <p className="ch-h">
        <SplitText text={adoption.heading} />
      </p>
      <p data-reveal className="t-lead measure-wide mt-6">
        {adoption.lede}
      </p>

      <div
        className="ch-gap grid rule-top rule-bottom sm:grid-cols-3"
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

      <div className="ch-gap">
        <h3 data-reveal className="t-coord mb-5">
          Role-based tracks
        </h3>
        <div
          className="grid gap-px border border-line bg-line sm:grid-cols-2"
          data-reveal-group
        >
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

      <div className="ch-gap">
        <h3 data-reveal className="t-coord mb-5">
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
    </Chapter>
  );
}
