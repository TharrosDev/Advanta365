import Sheet from "@/components/ui/Sheet";
import TextScrub from "@/components/fx/TextScrub";
import { problem } from "@/lib/content";

/**
 * Sheet 01 — the failure state as a fault register: three labelled fault
 * nodes, closed by a scroll-scrubbed statement. Server component.
 */
export default function Problem() {
  return (
    <Sheet
      id="problem"
      refNo={problem.index}
      kicker={problem.kicker}
      title={problem.heading}
      lede={problem.lede}
      className="band-2"
    >
      <div className="grid gap-4 md:grid-cols-3" data-reveal-group>
        {problem.incidents.map((inc) => (
          <article key={inc.code} data-reveal className="fault-node">
            <div className="fault-top">
              <span className="fault-code">{inc.code}</span>
              <span className="fault-flag">Unresolved</span>
            </div>
            <h3 className="fault-title">{inc.title}</h3>
            <p className="fault-body">{inc.body}</p>
          </article>
        ))}
      </div>

      <div className="section-gap max-w-4xl">
        <TextScrub text={problem.statement} className="t-h2" />
      </div>
    </Sheet>
  );
}
