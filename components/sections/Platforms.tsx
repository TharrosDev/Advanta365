import Chapter from "@/components/ui/Chapter";
import SplitText from "@/components/ui/SplitText";
import { platforms } from "@/lib/content";

/**
 * Chapter 05 — the surface: SharePoint, Teams, OneDrive as stacked rows
 * that invert to bone on hover. Server component.
 */
export default function Platforms() {
  return (
    <Chapter
      id="platforms"
      index={platforms.index}
      word={platforms.word}
      kicker={platforms.kicker}
      className="band-2"
    >
      <p className="ch-h">
        <SplitText text={platforms.heading} />
      </p>
      <p data-reveal className="t-lead measure-wide mt-6">
        {platforms.lede}
      </p>

      <div className="ch-gap" data-reveal-group>
        {platforms.items.map((p) => (
          <article key={p.name} data-reveal className="plat-row">
            <h3 className="plat-name">{p.name}</h3>
            <p className="plat-role t-body">{p.role}</p>
            <ul className="plat-themes">
              {p.themes.map((t) => (
                <li key={t} className="plat-theme">
                  {t}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </Chapter>
  );
}
