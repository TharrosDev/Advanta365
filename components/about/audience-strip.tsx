import { Appear } from "@/components/ui/appear";
import { Band } from "@/components/ui/band";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Icon } from "@/components/ui/icon";
import { Split } from "@/components/ui/split";
import { cx } from "@/lib/cx";
import styles from "./audience-strip.module.css";

const TITLE = "For the people who answer for the rollout.";

/** The owner's five buyers, in his order (PRODUCT.md). */
const BUYERS = [
  "Change management leads",
  "IT and M365 project managers",
  "IM and records leads",
  "CIOs and sponsors",
  "Public sector and Crown corporations",
] as const;

const PROOF = "Proven in Canadian public-sector environments.";

const BEYOND =
  "SharePoint-first out of the box; the change management core fits almost any technology rollout.";

/**
 * `#who`: who it is for, on the desk, in one short band. The label in the margin; a heading, the
 * five buyers as a row of boxed names that wraps, and the one proof the owner states (the public
 * sector) under a bare tick, with what it covers beyond SharePoint.
 */
export function AudienceStrip() {
  return (
    <Band id="who" surface="desk" aria-labelledby="who-title">
      <Split margin={<Eyebrow>Who it is for</Eyebrow>} marginClassName={styles.margin}>
        <h2 id="who-title" className={cx("type-page", styles.title)}>
          {TITLE}
        </h2>
        <Appear as="ul" className={styles.buyers}>
          {BUYERS.map((buyer) => (
            <li key={buyer} className={cx("type-ui", styles.buyer)}>
              {buyer}
            </li>
          ))}
        </Appear>
        <p className={cx("type-copy", styles.proof)}>
          <Icon name="tick" className={styles.tick} />
          <span>
            {PROOF} {BEYOND}
          </span>
        </p>
      </Split>
    </Band>
  );
}
