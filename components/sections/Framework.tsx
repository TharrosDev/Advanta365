import Sheet from "@/components/ui/Sheet";
import { framework } from "@/lib/content";

/**
 * Sheet 02 — the operating model as a four-node keyline grid: each principle
 * a labelled cell wired into one governed system. Server component.
 */
export default function Framework() {
  return (
    <Sheet
      id="framework"
      refNo={framework.index}
      kicker={framework.kicker}
      title={framework.heading}
      lede={framework.lede}
      className="draft-grid"
    >
      <div className="cell-grid" data-reveal-group>
        {framework.principles.map((p, i) => (
          <article key={p.title} data-reveal className="cell">
            <span className="cell-code">
              PRN-{String(i + 1).padStart(2, "0")}
            </span>
            <h3 className="node-title">{p.title}</h3>
            <p className="node-body t-body">{p.body}</p>
          </article>
        ))}
      </div>
    </Sheet>
  );
}
