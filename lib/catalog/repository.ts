import { bundles as rawBundles } from "@/content/bundles";
import { phases as rawPhases } from "@/content/phases";
import { templates as rawTemplates } from "@/content/templates";
import type { Bundle, Phase, Template } from "./schema";
import { validateCatalog } from "./validate";

// The only module that reads content/. Functions are async, so the file source can be
// swapped without changing any caller.
const catalog = validateCatalog({
  phases: rawPhases,
  templates: rawTemplates,
  bundles: rawBundles,
});

const phasesBySlug = new Map(catalog.phases.map((p) => [p.slug, p]));
const templatesBySlug = new Map(catalog.templates.map((t) => [t.slug, t]));
const bundlesBySlug = new Map(catalog.bundles.map((b) => [b.slug, b]));

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

export async function getBundles(): Promise<Bundle[]> {
  return catalog.bundles;
}

export async function getBundle(slug: string): Promise<Bundle | undefined> {
  return bundlesBySlug.get(slug);
}

export async function getBundleTemplates(bundle: Bundle): Promise<Template[]> {
  return bundle.templateSlugs.flatMap((slug) => templatesBySlug.get(slug) ?? []);
}

export async function getBundlesContaining(templateSlug: string): Promise<Bundle[]> {
  return catalog.bundles.filter((bundle) => bundle.templateSlugs.includes(templateSlug));
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
  return catalog.templates.some((t) => t.isSample) || catalog.bundles.some((b) => b.isSample);
}
