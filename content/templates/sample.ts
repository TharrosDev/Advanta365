type SampleInput = {
  slug: string;
  title: string;
  step: string;
  deliverableType: string;
  apps: string[];
  audiences: string[];
  format: string;
  adkar: string[];
  priceCents: number;
  pageCount?: number;
  featured?: boolean;
  summary: string;
  description: string;
  includes: string[];
};

/** Marks a phase's entries as sample content. Real catalog entries should not use this helper. */
export function sample(phase: string, entries: SampleInput[]) {
  return entries.map((entry) => ({
    ...entry,
    phase,
    featured: entry.featured ?? false,
    isSample: true,
  }));
}
