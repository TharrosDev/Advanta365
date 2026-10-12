import { phases as rawPhases } from "@/content/phases";
import { templates as rawTemplates } from "@/content/templates";
import { workedExampleContents } from "@/content/worked-example";
import type { Phase, Template } from "./schema";
import { validateCatalog } from "./validate";
import { contentsRows, type ContentsRow } from "./worked-example";

// The only module that reads content/. Functions are async, so the file source can be
// swapped without changing any caller.
const catalog = validateCatalog({
  phases: rawPhases,
  templates: rawTemplates,
});

const phasesBySlug = new Map(catalog.phases.map((p) => [p.slug, p]));
const templatesBySlug = new Map(catalog.templates.map((t) => [t.slug, t]));

export async function getPhases(): Promise<Phase[]> {
  return catalog.phases;
}

export async function getPhase(slug: string): Promise<Phase | undefined> {
  return phasesBySlug.get(slug);
}

export async function getTemplates(): Promise<Template[]> {
  return catalog.templates;
}

export async function getTemplate(slug: string): Promise<Template | undefined> {
  return templatesBySlug.get(slug);
}

/** The six free samples, in phase order. */
export async function getFreeTemplates(): Promise<Template[]> {
  return catalog.templates.filter((t) => t.free);
}

/** Templates from the same step first, then the rest of the same phase. */
export async function getRelatedTemplates(slug: string, limit = 4): Promise<Template[]> {
  const source = templatesBySlug.get(slug);
  if (!source) return [];
  const samePhase = catalog.templates.filter((t) => t.phase === source.phase && t.slug !== slug);
  return [
    ...samePhase.filter((t) => t.step === source.step),
    ...samePhase.filter((t) => t.step !== source.step),
  ].slice(0, limit);
}

export async function hasSampleContent(): Promise<boolean> {
  return catalog.templates.some((t) => t.isSample);
}

/**
 * The worked example's table of contents, each section resolved against the catalog, and whether
 * the sections are still placeholders (content/worked-example.ts).
 */
export async function getWorkedExampleContents(): Promise<{
  placeholder: boolean;
  sections: ContentsRow[];
}> {
  return {
    placeholder: workedExampleContents.placeholder,
    sections: contentsRows(workedExampleContents.entries, catalog.templates, catalog.phases),
  };
}
