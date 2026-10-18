import { TransitionLink } from "@/components/ui/transition-link";
import { cx } from "@/lib/cx";
import styles from "./breadcrumbs.module.css";

/**
 * The trail of a page: `Home / Define the change`. Every item but the last is a link; the last item is the
 * current page, set heavier. The items sit on one baseline and wrap as whole items; a separator
 * stays at the end of the item before it, so no line starts with one. The separators are decorative
 * and hidden from assistive technology.
 */
export function Breadcrumbs({ items }: { items: Array<{ href?: string; label: string }> }) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className={cx("type-note", styles.list)}>
        {items.map((item, index) => (
          <li key={`${index}-${item.label}`} className={styles.item}>
            {item.href ? (
              <TransitionLink href={item.href} className={styles.link}>
                {item.label}
              </TransitionLink>
            ) : (
              <span aria-current="page" className={styles.current}>
                {item.label}
              </span>
            )}
            {index < items.length - 1 ? (
              <span aria-hidden="true" className={styles.separator}>
                /
              </span>
            ) : null}
          </li>
        ))}
      </ol>
    </nav>
  );
}
