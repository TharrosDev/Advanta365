import { TemplateCard } from "@/components/catalog/template-card";
import { Band } from "@/components/ui/band";
import { Button } from "@/components/ui/button";
import { ShelfHead } from "@/components/ui/shelf-head";
import type { Template } from "@/lib/catalog/schema";
import styles from "./home.module.css";

/**
 * `#featured`: a shelf on the paper band. The header carries the link to the catalog (it names the
 * sample catalog: the toolkit counts sit two sections down, and the catalog does not list that
 * many). Below it the featured templates, three across from 68em, two from 40em and as row cards
 * below that. The band is only as tall as its content.
 */
export function FeaturedSection({
  templates,
  phaseNames,
}: {
  templates: Template[];
  phaseNames: ReadonlyMap<string, string>;
}) {
  return (
    <Band id="featured" surface="paper">
      <ShelfHead
        eyebrow="Featured"
        title="Featured templates"
        action={
          <Button variant="outline" href="/catalog" arrow>
            Browse the sample catalog
          </Button>
        }
      />
      {templates.length > 0 ? (
        <ul className={styles.cardGrid}>
          {templates.map((template) => (
            <li key={template.slug} className={styles.cardItem}>
              <TemplateCard template={template} phaseName={phaseNames.get(template.phase)} />
            </li>
          ))}
        </ul>
      ) : null}
    </Band>
  );
}
