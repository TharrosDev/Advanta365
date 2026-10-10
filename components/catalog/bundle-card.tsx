import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { Bundle } from "@/lib/catalog/schema";
import { formatPrice } from "@/lib/format";

type BundleCardProps = { bundle: Bundle; templateCount: number; savingsCents: number };

export function BundleCard({ bundle, templateCount, savingsCents }: BundleCardProps) {
  return (
    <article className="group border-rule bg-surface hover:border-accent relative flex h-full flex-col rounded-lg border p-6 transition-colors">
      <div className="flex flex-wrap gap-1.5">
        <Badge tone="accent">Bundle</Badge>
        <Badge>{templateCount} templates</Badge>
      </div>
      <h3 className="mt-3 text-xl font-semibold break-words">
        <Link
          href={`/bundles/${bundle.slug}`}
          className="underline-offset-4 group-hover:underline after:absolute after:inset-0"
        >
          {bundle.title}
        </Link>
      </h3>
      <p className="text-muted mt-2 grow text-sm">{bundle.summary}</p>
      <div className="border-rule mt-5 flex items-baseline justify-between border-t pt-4">
        {savingsCents > 0 ? (
          <span className="text-accent text-sm font-medium">Save {formatPrice(savingsCents)}</span>
        ) : (
          <span />
        )}
        <span className="text-lg font-semibold tabular-nums">{formatPrice(bundle.priceCents)}</span>
      </div>
    </article>
  );
}
