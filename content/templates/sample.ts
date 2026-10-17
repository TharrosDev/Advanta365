import type { TemplateFile } from "@/lib/catalog/schema";

type SampleInput = {
  slug: string;
  title: string;
  deliverableType: string;
  apps: string[];
  audiences: string[];
  format: string;
  adkar: string[];
  pageCount?: number;
  free?: boolean;
  summary: string;
  description: string;
  includes: string[];
  files?: TemplateFile[];
};

/** Marks a phase's entries as sample content. Real catalog entries should not use this helper. */
export function sample(phase: string, entries: SampleInput[]) {
  return entries.map((entry) => ({
    ...entry,
    phase,
    free: entry.free ?? false,
    isSample: true,
  }));
}
