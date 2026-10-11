import { GatherItem, GatherReveal, GatherWords } from "@/components/motion/gather-reveal";
import { Chip } from "@/components/ui/chip";
import { SectionShell } from "@/components/ui/section-shell";
import { APPS, APP_LABELS } from "@/content/taxonomy";
import { cx } from "@/lib/cx";
import styles from "./home.module.css";

/** The Microsoft 365 products the templates cover, without the catch-all "general" entry. */
const PRODUCTS = APPS.filter((app) => app !== "m365-general").map((app) => APP_LABELS[app]);

/**
 * A short dark band between Values and the closing section: a one-line label and the product names
 * as plain outlined chips (text only, not links). The label and the chip list start stacked on the
 * centre line and slide apart when the band scrolls into view (GatherReveal).
 */
export function BuiltForBand() {
  return (
    <SectionShell theme="dark" innerClassName={styles.builtFor}>
      <GatherReveal className={styles.builtForBand}>
        <p className={cx("t-body-large", styles.builtForLabel)}>
          <GatherWords text="Built for Microsoft 365" />
        </p>
        <ul className={styles.chips}>
          {PRODUCTS.map((label, index) => (
            <GatherItem key={label} as="li" index={index}>
              <Chip variant="outline">{label}</Chip>
            </GatherItem>
          ))}
        </ul>
      </GatherReveal>
    </SectionShell>
  );
}
