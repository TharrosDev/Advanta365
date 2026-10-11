import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { TransitionLink } from "@/components/ui/transition-link";
import { cx } from "@/lib/cx";
import styles from "./pagination.module.css";

/**
 * Page navigation for a result list: Previous, every page number, Next. Renders nothing for a
 * single page. The current page is text with `aria-current="page"`, drawn as the highlighter; every
 * other entry is a link. From 40em the three parts share one row with the numbers in the middle;
 * below, the numbers take the first row and Previous and Next the second.
 */
export function Pagination({
  page,
  pageCount,
  hrefFor,
}: {
  page: number;
  pageCount: number;
  hrefFor: (page: number) => string;
}) {
  if (pageCount <= 1) return null;
  const pages = Array.from({ length: pageCount }, (_, i) => i + 1);

  return (
    <nav aria-label="Pagination" className={styles.root}>
      {page > 1 ? (
        <Button variant="outline" size="sm" href={hrefFor(page - 1)} className={styles.previous}>
          <Icon name="arrow" flip className={styles.back} />
          Previous
        </Button>
      ) : null}
      <ol className={styles.pages}>
        {pages.map((n) => (
          <li key={n}>
            {n === page ? (
              <span
                aria-current="page"
                className={cx("type-ui", "tabular", styles.page, styles.current)}
              >
                <span className="visually-hidden">Page </span>
                {n}
              </span>
            ) : (
              <TransitionLink href={hrefFor(n)} className={cx("type-ui", "tabular", styles.page)}>
                <span className="visually-hidden">Page </span>
                {n}
              </TransitionLink>
            )}
          </li>
        ))}
      </ol>
      {page < pageCount ? (
        <Button variant="outline" size="sm" arrow href={hrefFor(page + 1)} className={styles.next}>
          Next
        </Button>
      ) : null}
    </nav>
  );
}
