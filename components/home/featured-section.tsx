import { TemplateTile, TileGrid } from "@/components/catalog/template-tile";
import { Band } from "@/components/ui/band";
import { Button } from "@/components/ui/button";
import { ShelfHead } from "@/components/ui/shelf-head";
import type { Phase, Template } from "@/lib/catalog/schema";

/**
 * `#featured`: the free samples, on the desk. The head stands at the left with the link to the
 * catalog under the title (it names the sample catalog: the toolkit counts sit one section down,
 * and the catalog does not list that many). Under it the six free templates are tiles in one grid:
 * six across where the band is at its widest, two on a phone. Each links to the catalog, where the
 * template opens in the pop-up.
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
        eyebrow="Free samples"
        title="Six free sample templates"
        action={
          <Button variant="outline" href="/catalog" arrow>
            Browse the sample catalog
          </Button>
        }
      />
      {templates.length > 0 ? (
        <TileGrid locks={false}>
          {templates.map((template) => {
            const phase = phaseOf.get(template.phase);
            return (
              <li key={template.slug}>
                <TemplateTile
                  template={template}
                  phaseName={phase?.name}
                  phaseOrder={phase?.order}
                  href={`/catalog?view=${template.slug}`}
                />
              </li>
            );
          })}
        </TileGrid>
      ) : null}
    </Band>
  );
}
