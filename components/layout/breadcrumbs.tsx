import { TransitionLink } from "@/components/motion/transition-link";
import { cx } from "@/lib/cx";
import styles from "./breadcrumbs.module.css";

/**
 * The trail above a page title: `Home / Prepare`. Every item but the last is a link; the last item is
 * the current page. The separators are decorative and hidden from assistive technology.
 */
export function Breadcrumbs({ items }: { items: Array<{ href?: string; label: string }> }) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className={cx("t-label-medium", "c-fg-50", styles.list)}>
        {items.map((item, index) => (
          <li key={`${index}-${item.label}`} className={styles.item}>
            {index > 0 ? (
              <span aria-hidden="true" className={styles.separator}>
                /
              </span>
            ) : null}
            {item.href ? (
              <TransitionLink href={item.href} className={styles.link}>
                {item.label}
              </TransitionLink>
            ) : (
              <span aria-current="page" className="c-fg-100">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
