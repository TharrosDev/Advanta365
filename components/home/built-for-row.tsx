import { Band } from "@/components/ui/band";
import { Eyebrow } from "@/components/ui/eyebrow";
import { APPS, APP_LABELS } from "@/content/taxonomy";
import styles from "./home.module.css";

/** The Microsoft 365 products the templates cover, without the catch-all "general" entry. */
const PRODUCTS = APPS.filter((app) => app !== "m365-general").map((app) => APP_LABELS[app]);

/**
 * The last line of the paper area: a label and, under it, the product names set large in one
 * wrapping line, a slash between them. Static text, not links; the slashes are not read out, and a
 * name never parts from the slash that follows it. The band has no padding above (the values band
 * supplies the space).
 */
export function BuiltForRow() {
  return (
    <Band surface="paper" pad="none" className={styles.builtFor}>
      <Eyebrow>Built for Microsoft 365</Eyebrow>
      <ul className={styles.builtForNames}>
        {PRODUCTS.map((label, index) => (
          <li key={label} className={styles.builtForName}>
            {label}
            {index < PRODUCTS.length - 1 ? (
              <span aria-hidden="true" className={styles.builtForSlash}>
                /
              </span>
            ) : null}
          </li>
        ))}
      </ul>
    </Band>
  );
}
