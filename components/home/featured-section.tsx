import { TemplateCard } from "@/components/catalog/template-card";
import { Band } from "@/components/ui/band";
import { Button } from "@/components/ui/button";
import { ShelfHead } from "@/components/ui/shelf-head";
import type { Phase, Template } from "@/lib/catalog/schema";
import styles from "./home.module.css";

/**
 * `#featured`: the spread, on the desk. The head stands at the left with the link to the catalog
 * under the title (it names the sample catalog: the toolkit counts sit one section down, and the
 * catalog does not list that many). Under it six templates lie as sheets of paper: from 68em in
 * two rows of the twelve-column grid, five, three and four columns wide and then four, five and
 * three, so no two rows line up; two across from 40em; index rows below that. A cell is as tall
 * as its row, so the prices of a row stand on one line.
 */
export function FeaturedSection({
  templates,
  phases,
}: {
  templates: Template[];
  phases: readonly Phase[];
}) {
  const phaseOf = new Map(phases.map((phase) => [phase.slug, phase]));

  return (
    <Band id="featured" surface="desk">
      <ShelfHead
        stack
        eyebrow="Featured"
        title="Featured templates"
        action={
          <Button variant="outline" href="/catalog" arrow>
            Browse the sample catalog
          </Button>
        }
      />
      {templates.length > 0 ? (
        <ul className={styles.spread}>
          {templates.map((template, index) => {
            const phase = phaseOf.get(template.phase);
            return (
              <li key={template.slug} className={styles.spreadItem}>
                <TemplateCard
                  template={template}
                  layout="sheet"
                  index={index + 1}
                  phaseName={phase?.name}
                  phaseOrder={phase?.order}
                />
              </li>
            );
          })}
        </ul>
      ) : null}
    </Band>
  );
}
