import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { DELIVERABLE_TYPE_LABELS, FORMAT_LABELS } from "@/content/taxonomy";
import type { Template } from "@/lib/catalog/schema";
import { formatPrice } from "@/lib/format";

export function TemplateCard({ template, phaseName }: { template: Template; phaseName?: string }) {
  return (
    <article className="group relative flex h-full flex-col rounded-lg border border-rule bg-surface p-5 transition-colors hover:border-accent">
      <div className="flex flex-wrap gap-1.5">
        {phaseName && <Badge tone="accent">{phaseName}</Badge>}
        <Badge>{DELIVERABLE_TYPE_LABELS[template.deliverableType]}</Badge>
      </div>
      <h3 className="mt-3 text-lg font-semibold break-words">
        <Link
          href={`/templates/${template.slug}`}
          className="underline-offset-4 group-hover:underline after:absolute after:inset-0"
        >
          {template.title}
        </Link>
      </h3>
      <p className="mt-2 grow text-sm text-muted">{template.summary}</p>
      <div className="mt-4 flex items-baseline justify-between border-t border-rule pt-3">
        <span className="text-xs text-muted">{FORMAT_LABELS[template.format]}</span>
        <span className="font-semibold tabular-nums">{formatPrice(template.priceCents)}</span>
      </div>
    </article>
  );
}
