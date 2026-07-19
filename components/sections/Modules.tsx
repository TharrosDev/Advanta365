import Chapter from "@/components/ui/Chapter";
import SplitText from "@/components/ui/SplitText";
import { registry } from "@/lib/content";

/**
 * Chapter 04 — the registry: five module cards. Server component.
 */
export default function Modules() {
  return (
    <Chapter
      id="modules"
      index={registry.index}
      word={registry.word}
      kicker={registry.kicker}
    >
      <p className="ch-h">
        <SplitText text={registry.heading} />
      </p>
      <p data-reveal className="t-lead measure-wide mt-6">
        {registry.lede}
      </p>

      <ul className="ch-gap flex flex-col gap-4" data-reveal-group>
        {registry.modules.map((mod) => (
          <li key={mod.code} data-reveal className="d-card mod-card">
            <div className="mod-card-top">
              <span className="mod-code">{mod.code}</span>
              <span className="chip">{mod.tag}</span>
            </div>
            <h3 className="mod-title">{mod.title}</h3>
            <p className="mod-body">{mod.body}</p>
          </li>
        ))}
      </ul>
    </Chapter>
  );
}
