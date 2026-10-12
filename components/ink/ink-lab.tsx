import { IntroCover } from "@/components/intro/intro-cover";
import { INTRO_BACKSTOP_MS } from "@/lib/boot/state";
import { cx } from "@/lib/cx";
import { STAGES } from "@/lib/ink/stage";
import type { SceneName } from "@/lib/ink/types";
import { InkBackdrop } from "./ink-backdrop";
import styles from "./ink-lab.module.css";
import { InkLayer } from "./ink-layer";

/** Top to bottom. The load-in comes first: it plays once, clears, and the page below is clean. */
const ORDER: readonly SceneName[] = ["intro", "hero", "title", "ninety", "bloom", "spill", "wisps"];

/**
 * What the boot script does for a first visit of the home page, done here on request (`?cover=1`)
 * so the cover and the ink's take-over can be watched on the lab page: the state on the root
 * element before first paint, off again when the cover's own animation ends.
 */
const COVER_SCRIPT = `(function(){var r=document.documentElement;r.setAttribute("data-intro","play");
function own(e){return e.target&&e.target.hasAttribute&&e.target.hasAttribute("data-intro-cover")}
function end(e){if(e&&!own(e))return;removeEventListener("animationend",end);r.removeAttribute("data-intro")}
addEventListener("animationend",end);
addEventListener("keydown",function(){if(r.hasAttribute("data-intro"))r.setAttribute("data-intro","leave")},{once:true});
setTimeout(end,${INTRO_BACKSTOP_MS})})()`;

function Copy({ title, kind = "text" }: { title: string; kind?: "text" | "display" }) {
  return (
    <div className={styles.copy} data-ink-calm={kind === "text" ? "text" : undefined}>
      <p className="type-eyebrow">Ink lab</p>
      <h2 className="type-banner" data-ink-calm={kind === "display" ? "display" : undefined}>
        {title}
      </h2>
      <p className="type-lead">
        A mock stage: words where a page has words, open water where it has none.
      </p>
    </div>
  );
}

function Stage({ scene, bare, tall }: { scene: SceneName; bare: boolean; tall: boolean }) {
  const dark = STAGES[scene].ground === "binder";
  const band = dark ? "binder" : "paper";
  const className = cx(styles.stage, tall && styles.full, scene === "title" && styles.short);
  const label = (
    <p className={cx("type-tag", styles.label)}>
      {scene} · runs {STAGES[scene].runMs / 1000}s
    </p>
  );

  if (bare || scene === "intro") {
    return (
      <section data-band={band} data-lab-stage={scene} className={className}>
        <InkBackdrop scene={scene} />
        {!bare && label}
      </section>
    );
  }

  switch (scene) {
    case "hero":
    case "spill":
      return (
        <section data-band={band} data-lab-stage={scene} className={className}>
          <InkBackdrop scene={scene} edges="bottom" />
          <div className={styles.columns}>
            <Copy
              title={scene === "hero" ? "The tank beside the headline." : "A bottle, knocked over."}
            />
            <div className={styles.open} data-ink-anchor="open" />
          </div>
          {label}
        </section>
      );
    case "title":
      return (
        <section data-band={band} data-lab-stage={scene} className={className}>
          <InkBackdrop scene={scene} edges="left bottom" className={styles.aside} />
          <div className={styles.columns}>
            <Copy title="A title block." />
          </div>
          {label}
        </section>
      );
    case "ninety":
      return (
        <section data-band={band} data-lab-stage={scene} data-ninety="" className={className}>
          <InkBackdrop scene={scene} edges="top bottom" />
          <div className={styles.columns}>
            <Copy title="Ninety, and the tenth." />
            <div className={styles.open} data-ink-anchor="open" />
          </div>
          <div className={styles.tally}>
            {Array.from({ length: 10 }, (_, index) => (
              <span
                key={index}
                className={cx(styles.block, index === 9 && styles.tenth)}
                data-ink-anchor={index === 9 ? "tenth" : undefined}
              />
            ))}
          </div>
          {label}
        </section>
      );
    case "bloom":
      return (
        <section data-band={band} data-lab-stage={scene} className={className}>
          <InkBackdrop scene={scene} edges="top" />
          <div className={styles.centre}>
            <Copy title="The last ten percent is yours." kind="display" />
          </div>
          {label}
        </section>
      );
    default:
      return (
        <section data-band={band} data-lab-stage={scene} className={className}>
          <InkBackdrop scene={scene} edges="top" />
          <div className={styles.grid} data-ink-calm="veil">
            <p className="type-item">Advanta365</p>
            <p className="type-copy">Catalog, samples, purchase.</p>
            <p className="type-copy">About, contact, sample.</p>
            <p className="type-copy">Prepare, launch, sustain.</p>
          </div>
          {label}
        </section>
      );
  }
}

type InkLabProps = {
  /** Show this scene alone, in a stage as tall as the window. */
  only?: SceneName;
  /** No words in the stage: open water from edge to edge, with no zones. */
  bare?: boolean;
  /** Open under the cover of a first visit, as the home page does. */
  cover?: boolean;
};

/**
 * The ink lab, a development page: every scene in a mock stage with the words, zones and anchors a
 * real page gives it, and its own ink layer. Scroll from stage to stage and the one canvas follows.
 */
export function InkLab({ only, bare = false, cover = false }: InkLabProps) {
  const scenes = only ? [only] : ORDER;
  return (
    <main className={styles.lab}>
      {cover && (
        <div hidden dangerouslySetInnerHTML={{ __html: `<script>${COVER_SCRIPT}</script>` }} />
      )}
      {cover && <IntroCover />}
      <h1 className="type-note">Ink lab</h1>
      {scenes.map((scene) => (
        <Stage key={scene} scene={scene} bare={bare} tall={!!only} />
      ))}
      <InkLayer />
    </main>
  );
}
