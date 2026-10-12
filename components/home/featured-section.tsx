import { TemplateTile, TileGrid } from "@/components/catalog/template-tile";
import { Band } from "@/components/ui/band";
import { Button } from "@/components/ui/button";
import { ShelfHead } from "@/components/ui/shelf-head";
import { DEFAULT_CRITERIA } from "@/lib/catalog/query";
import type { Phase, Template } from "@/lib/catalog/schema";
import { catalogHref } from "@/lib/catalog/search-params";
import { FREE_SAMPLE_COUNT } from "@/lib/catalog/validate";
import { countWord } from "@/lib/format";

/**
 * `#featured`: the free samples, on the desk, right under the hero that shows the same six as a
 * hand of documents: here each one is named, with its phase, its type and its format, which is
 * what the heading says. The head stands at the left with the link to the
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
        title={`The ${countWord(FREE_SAMPLE_COUNT)} free samples, one by one`}
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
                  href={catalogHref(DEFAULT_CRITERIA, template.slug)}
                />
              </li>
            );
          })}
        </TileGrid>
      ) : null}
    </Band>
  );
}
