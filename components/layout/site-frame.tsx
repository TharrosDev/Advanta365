import styles from "./site-frame.module.css";

/**
 * Two faint vertical hairlines that mark the edges of the 2000px content column on screens wider
 * than that. Decorative: it never takes a click and is not rendered below 2000px.
 */
export function SiteFrame() {
  return <div className={styles.root} aria-hidden="true" />;
}
