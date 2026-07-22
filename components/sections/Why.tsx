import Sheet from "@/components/ui/Sheet";
import TextScrub from "@/components/fx/TextScrub";
import { why } from "@/lib/content";

/**
 * Sheet 07 — the position: a scrubbed statement over four differentiator
 * callouts, each marked but unnumbered. Server component.
 */
export default function Why() {
  return (
    <Sheet
      id="why"
      refNo={why.index}
      kicker={why.kicker}
      title={why.heading}
      className="band-3"
    >
      <div className="max-w-4xl">
        <TextScrub text={why.statement} className="t-lead" />
      </div>

      <ul className="section-gap rule-top" data-reveal-group>
        {why.reasons.map((r) => (
          <li key={r.num} data-reveal className="why-row">
            <div className="why-tag">
              <span className="why-marker" aria-hidden="true" />
              <h3 className="why-title">{r.title}</h3>
            </div>
            <p className="why-body t-body">{r.body}</p>
          </li>
        ))}
      </ul>
    </Sheet>
  );
}
