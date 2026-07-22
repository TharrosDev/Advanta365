import Sheet from "@/components/ui/Sheet";
import { registry } from "@/lib/content";

/**
 * Sheet 04 — the module registry: five working modules as labelled nodes in
 * the drawing set. Server component.
 */
export default function Modules() {
  return (
    <Sheet
      id="modules"
      refNo={registry.index}
      kicker={registry.kicker}
      title={registry.heading}
      lede={registry.lede}
    >
      <div
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        data-reveal-group
      >
        {registry.modules.map((mod) => (
          <article key={mod.code} data-reveal className="node">
            <div className="flex items-center justify-between gap-3">
              <span className="node-code">{mod.code}</span>
              <span className="chip">{mod.tag}</span>
            </div>
            <h3 className="node-title">{mod.title}</h3>
            <p className="node-body">{mod.body}</p>
          </article>
        ))}
      </div>
    </Sheet>
  );
}
