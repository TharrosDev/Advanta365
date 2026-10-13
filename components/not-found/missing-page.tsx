import { Band } from "@/components/ui/band";
import { BandedList, BandedRow } from "@/components/ui/banded-list";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/eyebrow";
import { PageShift } from "@/components/ui/page-shift";
import { RowLink } from "@/components/ui/row-link";
import { cx } from "@/lib/cx";
import { AskedPath } from "./asked-path";
import { LateBoot } from "./late-boot";
import styles from "./missing-page.module.css";

const NEXT_LINKS = [
  { href: "/catalog", label: "Browse the catalog" },
  { href: "/sample", label: "See a sample" },
  { href: "/contact", label: "Contact" },
] as const;

/**
 * The 404 page: one band of white paper. From 68em the text stands in columns 1 to 6 (the figure
 * "404", the requested address, the one `<h1>` of the page, a sentence, the way home and a short
 * ledger of places to go next). Below 68em it is one column.
 *
 * Used inside the site layout (header and footer stay) and as the fallback outside it.
 */
export function MissingPage() {
  return (
    <Band as="div" surface="paper" className={styles.band} innerClassName={styles.root}>
      <LateBoot />
      <PageShift>
        <div className={styles.text}>
          <p className={cx("type-poster", styles.figure)} aria-hidden="true">
            404
          </p>
          <AskedPath />
          <h1 className={cx("type-banner", styles.title)}>Page not found</h1>
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
      </PageShift>
    </Band>
  );
}
