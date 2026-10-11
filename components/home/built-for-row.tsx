import { Band } from "@/components/ui/band";
import { Split } from "@/components/ui/split";
import { Tag } from "@/components/ui/tag";
import { APPS, APP_LABELS } from "@/content/taxonomy";
import { cx } from "@/lib/cx";
import styles from "./home.module.css";

/** The Microsoft 365 products the templates cover, without the catch-all "general" entry. */
const PRODUCTS = APPS.filter((app) => app !== "m365-general").map((app) => APP_LABELS[app]);

/**
 * One row at the foot of the paper area: a label in the margin and the product names as plain tags,
 * 7px apart, wrapping. Static text, not links. The band has no padding above it (the values band
 * above supplies the space) and 84px below, and its margin carries no rule.
 */
export function BuiltForRow() {
  return (
    <Band surface="paper" pad="none" className={styles.builtFor}>
      <Split
        rule={false}
        margin={<p className={cx("type-item", styles.builtForLabel)}>Built for Microsoft 365</p>}
      >
        <ul className={styles.builtForTags}>
          {PRODUCTS.map((label) => (
            <li key={label}>
              <Tag variant="plain">{label}</Tag>
            </li>
          ))}
        </ul>
      </Split>
    </Band>
  );
}
