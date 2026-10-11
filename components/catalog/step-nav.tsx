import { WipeLink } from "@/components/ui/wipe-link";
import type { Step } from "@/lib/catalog/schema";
import { cx } from "@/lib/cx";
import styles from "./step-nav.module.css";

/** The steps of one phase as in-page anchors, in order. Each link jumps to its `<section id>`. */
export function StepNav({ steps }: { steps: readonly Step[] }) {
  return (
    <nav aria-label="Steps in this phase" className={cx(styles.root, "ruled")}>
      <ul className={cx("t-body-large", styles.list)}>
        {steps.map((step) => (
          <li key={step.slug} className={styles.item}>
            <WipeLink variant="underline" href={`#${step.slug}`}>
              {step.name}
            </WipeLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
