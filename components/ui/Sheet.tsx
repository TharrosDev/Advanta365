import type { ReactNode } from "react";
import SplitText from "@/components/ui/SplitText";

type Props = {
  id: string;
  /** Drawing-set sheet reference, e.g. "01". Diegetic to the blueprint. */
  refNo: string;
  kicker: string;
  title: string;
  lede?: string;
  /** Extra classes on the section (band-2 / band-3 / draft-grid). */
  className?: string;
  children: ReactNode;
};

/**
 * A drawing sheet: the site's core layout unit. A header plate (sheet
 * reference + kicker annotation, masked title, and an optional lede set
 * opposite it) over the section body. Server component — the masked title
 * reveal and any schematic motion are client-side underneath.
 */
export default function Sheet({
  id,
  refNo,
  kicker,
  title,
  lede,
  className,
  children,
}: Props) {
  return (
    <section id={id} className={`sheet${className ? ` ${className}` : ""}`}>
      <div className="u-container pad-block-xl">
        <div className="sheet-head">
          <div>
            <div className="plate-meta">
              <span className="sheet-ref" aria-hidden="true">
                {refNo} / 08
              </span>
              <span className="annot">{kicker}</span>
            </div>
            <SplitText as="h2" className="plate-title" text={title} />
          </div>
          {lede ? (
            <p data-reveal className="t-lead measure-wide">
              {lede}
            </p>
          ) : null}
        </div>

        <div className="section-gap">{children}</div>
      </div>
    </section>
  );
}
