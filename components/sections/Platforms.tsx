import Sheet from "@/components/ui/Sheet";
import { platforms } from "@/lib/content";

/** A drawn hand-off connector between two stacked platforms. Visual only. */
function HandOff() {
  return (
    <div className="plat-link" aria-hidden="true">
      <svg width="24" height="22" viewBox="0 0 24 22" fill="none">
        <path
          className="draw"
          d="M12 2 V15"
          stroke="var(--color-cobalt)"
          strokeWidth="1.5"
          strokeLinecap="round"
          pathLength="1"
        />
        <path
          d="M7.5 10.5 L12 15.5 L16.5 10.5"
          stroke="var(--color-cobalt)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

/**
 * Sheet 05 — the surface as a data-flow: SharePoint, Teams, and OneDrive
 * stacked with governed hand-off connectors drawn between them, so
 * information always resolves to one authoritative home. Server component.
 */
export default function Platforms() {
  return (
    <Sheet
      id="platforms"
      refNo={platforms.index}
      kicker={platforms.kicker}
      title={platforms.heading}
      lede={platforms.lede}
      className="band-2"
    >
      <div data-draw data-reveal-group>
        {platforms.items.map((p, i) => (
          <div key={p.name}>
            {i > 0 ? <HandOff /> : null}
            <article data-reveal className="plat-row">
              <div className="plat-head">
                <h3 className="plat-name">{p.name}</h3>
              </div>
              <p className="plat-role t-body">{p.role}</p>
              <ul className="plat-themes">
                {p.themes.map((t) => (
                  <li key={t} className="plat-theme">
                    {t}
                  </li>
                ))}
              </ul>
            </article>
          </div>
        ))}
      </div>
    </Sheet>
  );
}
