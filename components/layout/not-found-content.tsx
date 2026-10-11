import { Reveal, RevealWords } from "@/components/motion/reveal";
import { Container } from "@/components/ui/container";
import { ActionRow } from "@/components/ui/action-row";
import { WipeButton } from "@/components/ui/wipe-button";
import { cx } from "@/lib/cx";
import { coarseIndexAfter, countWords } from "@/lib/motion/words";
import { RequestedPath } from "./requested-path";
import styles from "./not-found-content.module.css";

const TITLE = "Page not found";
const DIGITS = ["4", "0", "4"] as const;

const INDEX_LINKS = [
  { href: "/catalog", label: "Browse the catalog" },
  { href: "/bundles", label: "Bundles" },
  { href: "/pricing", label: "Pricing" },
  { href: "/contact", label: "Contact" },
] as const;

/**
 * The 404 composition: a meta strip, the giant "404" beside the message and a short index of places
 * to go next. Used inside the site layout (header and footer stay) and as the fallback outside it.
 *
 * Reveal order. The digits run on the fine step (0..2) and the title words follow them (3..5). Every
 * later item is on the coarse step, counted from the last word: lede, button, "Index" caption, rows.
 */
export function NotFoundContent() {
  const lede = coarseIndexAfter(DIGITS.length + countWords(TITLE));
  const action = lede + 1;
  const caption = action + 1;
  const firstRow = caption + 1;

  return (
    <Container className={styles.root}>
      <Reveal as="div" effect="fade" index={0} className={styles.meta}>
        <span className="t-label-medium">Error 404</span>
        <span className={styles.metaAside}>
          <RequestedPath />
        </span>
      </Reveal>

      <div className={styles.body}>
        <p className={styles.figure} role="img" aria-label="404">
          {DIGITS.map((digit, position) => (
            <Reveal key={position} step="fine" index={position} aria-hidden="true">
              {digit}
            </Reveal>
          ))}
        </p>

        <div className={styles.column}>
          <div className={styles.text}>
            <h1 className="t-headline-large">
              <RevealWords text={TITLE} offset={DIGITS.length} />
            </h1>
            <p className={cx("t-body-large", "c-fg-60", styles.lede)}>
              <Reveal effect="fade" index={lede}>
                The page you are looking for does not exist or has moved.
              </Reveal>
            </p>
            <Reveal as="div" effect="fade-up" index={action} className={styles.action}>
              <WipeButton href="/" arrow="right">
                Go to home
              </WipeButton>
            </Reveal>
          </div>

          <nav aria-label="Index" className={styles.index}>
            <Reveal as="p" effect="fade" index={caption} className="t-label-medium c-fg-50">
              Index
            </Reveal>
            <ul className={styles.list}>
              {INDEX_LINKS.map((link, position) => (
                <Reveal key={link.href} as="li" effect="fade-up" index={firstRow + position}>
                  <ActionRow
                    fill
                    arrow="right"
                    href={link.href}
                    label={link.label}
                    rule={position === INDEX_LINKS.length - 1 ? "both" : "top"}
                  />
                </Reveal>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </Container>
  );
}
