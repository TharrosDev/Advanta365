import { TemplateCard } from "@/components/catalog/template-card";
import { Reveal } from "@/components/motion/reveal";
import { RevealGroup } from "@/components/motion/reveal-group";
import { SectionIntro } from "@/components/ui/section-intro";
import { SectionShell } from "@/components/ui/section-shell";
import { WipeButton } from "@/components/ui/wipe-button";
import type { Template } from "@/lib/catalog/schema";
import styles from "./home.module.css";

/**
 * `#featured`: six featured templates in a 1 / 2 / 3 column grid, then a link to the catalog. The
 * link names the sample catalog: the toolkit counts sit two sections up, and the catalog does not
 * list that many. The section has no fixed height, so it is only as tall as its content.
 *
 * Reveal order: label 0 and title words 1..2 in one group; cards fade up on `index % 3` (a row at a
 * time ripples left to right; the group plays once) and the catalog link follows at 3.
 */
export function FeaturedSection({
  templates,
  phaseNames,
}: {
  templates: Template[];
  phaseNames: ReadonlyMap<string, string>;
}) {
  return (
    <SectionShell id="featured" innerClassName={styles.featured}>
      <RevealGroup>
        <SectionIntro label="Featured" title="Featured templates" />
      </RevealGroup>
      <RevealGroup className={styles.featuredBlock}>
        {templates.length > 0 ? (
          <ul className={styles.cardGrid}>
            {templates.map((template, index) => (
              <Reveal key={template.slug} as="li" effect="fade-up" index={index % 3}>
                <TemplateCard template={template} phaseName={phaseNames.get(template.phase)} />
              </Reveal>
            ))}
          </ul>
        ) : null}
        <Reveal as="div" effect="fade-up" index={3} className={styles.sectionAction}>
          <WipeButton href="/catalog" arrow="right">
            Browse the sample catalog
          </WipeButton>
        </Reveal>
      </RevealGroup>
    </SectionShell>
  );
}
