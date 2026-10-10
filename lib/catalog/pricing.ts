import type { Bundle, Template } from "./schema";

/** What the templates in a bundle would cost bought one at a time. */
export function bundleValueCents(templates: Template[]): number {
  return templates.reduce((sum, template) => sum + template.priceCents, 0);
}

export function bundleSavingsCents(bundle: Bundle, templates: Template[]): number {
  return Math.max(0, bundleValueCents(templates) - bundle.priceCents);
}
