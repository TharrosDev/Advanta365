import type { Bundle, Template } from "./schema";

/** What the templates in a bundle would cost bought one at a time. */
export function bundleValueCents(templates: Template[]): number {
  return templates.reduce((sum, template) => sum + template.priceCents, 0);
}

export function bundleSavingsCents(bundle: Bundle, templates: Template[]): number {
  return Math.max(0, bundleValueCents(templates) - bundle.priceCents);
}

/** The span of what the catalog asks: its cheapest single template, up to its full-rollout bundle. */
export type PriceSpan = { fromCents: number; toCents?: number };

/**
 * From the cheapest template to the bundle that covers the whole rollout, read from the data so the
 * figures follow the catalog. The full-rollout bundle is one whose templates reach every phase (the
 * dearest, if there are several). Without one, `toCents` is left out; without templates there is no
 * span at all.
 */
export function catalogPriceSpan(
  templates: readonly Pick<Template, "slug" | "phase" | "priceCents">[],
  bundles: readonly Pick<Bundle, "templateSlugs" | "priceCents">[],
  phaseSlugs: readonly string[],
): PriceSpan | undefined {
  if (templates.length === 0) return undefined;
  const fromCents = Math.min(...templates.map((template) => template.priceCents));

  const phaseOf = new Map(templates.map((template) => [template.slug, template.phase]));
  const whole = bundles.filter((bundle) => {
    const reached = new Set(bundle.templateSlugs.map((slug) => phaseOf.get(slug)));
    return phaseSlugs.length > 0 && phaseSlugs.every((phase) => reached.has(phase));
  });
  if (whole.length === 0) return { fromCents };
  return { fromCents, toCents: Math.max(...whole.map((bundle) => bundle.priceCents)) };
}
