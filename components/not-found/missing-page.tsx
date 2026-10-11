import { Band } from "@/components/ui/band";
import { BandedList, BandedRow } from "@/components/ui/banded-list";
import { Blank } from "@/components/ui/blank";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/eyebrow";
import { RowLink } from "@/components/ui/row-link";
import { Sheet } from "@/components/ui/sheet";
import { Tally } from "@/components/ui/tally";
import { cx } from "@/lib/cx";
import { AskedPath } from "./asked-path";
import styles from "./missing-page.module.css";

const NEXT_LINKS = [
  { href: "/catalog", label: "Browse the catalog" },
  { href: "/sample", label: "See a sample" },
  { href: "/bundles", label: "Bundles" },
  { href: "/pricing", label: "Pricing" },
  { href: "/contact", label: "Contact" },
] as const;

/**
 * The 404 page: a blank page where a written one was expected. From 68em it has two parts. At the
 * left (columns 1 to 6) an empty sheet: the figure "404" with its middle digit highlighted, a blank
 * field, and a tally with nothing filled in. At the right (columns 8 to 12) the address that was
 * asked for, the one `<h1>` of the page, a sentence, the way home and a short list of places to go
 * next. Below 68em the sheet comes first and the text follows it.
 *
 * Used inside the site layout (header and footer stay) and as the fallback outside it.
 */
export function MissingPage() {
  return (
    <Band as="div" surface="desk" innerClassName={styles.root}>
      <Sheet className={styles.sheet}>
        <p className={cx("type-figure", styles.figure)} role="img" aria-label="404">
          <span aria-hidden="true">4</span>
          <span aria-hidden="true" className={styles.marked}>
            0
          </span>
          <span aria-hidden="true">4</span>
        </p>
        <Blank size="md" caret="steady" className={styles.blank} />
        <Tally total={10} filled={0} size="sm" className={styles.tally} />
      </Sheet>

      <div className={styles.text}>
        <AskedPath />
        <h1 className={cx("type-page", styles.title)}>Page not found</h1>
        <p className={cx("type-copy", styles.body)}>
          The page you are looking for does not exist or has moved.
        </p>
        <Button variant="mark" arrow href="/" className={styles.home}>
          Go to home
        </Button>

        <nav aria-labelledby="missing-next" className={styles.next}>
          <Eyebrow id="missing-next">Next</Eyebrow>
          <BandedList>
            {NEXT_LINKS.map((link) => (
              <BandedRow key={link.href}>
                <RowLink href={link.href} label={link.label} />
              </BandedRow>
            ))}
          </BandedList>
        </nav>
      </div>
    </Band>
  );
}
