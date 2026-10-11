import { TransitionLink } from "@/components/motion/transition-link";
import { ArrowIcon } from "@/components/ui/arrow-icon";
import { cx } from "@/lib/cx";
import styles from "./pagination.module.css";

/**
 * Page navigation for a result list: Previous, every page number, Next. Renders nothing for a single
 * page. The current page is text with `aria-current="page"`; every other entry is a link.
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
    <nav aria-label="Pagination" className={cx(styles.root, "ruled")}>
      {page > 1 ? (
        <TransitionLink
          href={hrefFor(page - 1)}
          className={cx("t-body-large", styles.step, styles.previous)}
        >
          <ArrowIcon direction="left" />
          Previous
        </TransitionLink>
      ) : null}
      <ol className={styles.pages}>
        {pages.map((n) => (
          <li key={n}>
            {n === page ? (
              <span
                aria-current="page"
                className={cx("t-label-large", "tabular", styles.page, styles.current)}
              >
                <span className="visually-hidden">Page </span>
                {n}
              </span>
            ) : (
              <TransitionLink
                href={hrefFor(n)}
                className={cx("t-label-large", "tabular", styles.page)}
              >
                <span className="visually-hidden">Page </span>
                {n}
              </TransitionLink>
            )}
          </li>
        ))}
      </ol>
      {page < pageCount ? (
        <TransitionLink
          href={hrefFor(page + 1)}
          className={cx("t-body-large", styles.step, styles.next)}
        >
          Next
          <ArrowIcon direction="right" />
        </TransitionLink>
      ) : null}
    </nav>
  );
}
