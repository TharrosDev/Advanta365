import Link from "next/link";

type PaginationProps = { page: number; pageCount: number; hrefFor: (page: number) => string };

const ITEM = "inline-flex min-h-11 min-w-11 items-center justify-center rounded-md px-3 text-sm";

export function Pagination({ page, pageCount, hrefFor }: PaginationProps) {
  if (pageCount <= 1) return null;
  const pages = Array.from({ length: pageCount }, (_, i) => i + 1);

  return (
    <nav aria-label="Pagination" className="flex flex-wrap items-center justify-center gap-1">
      {page > 1 && (
        <Link href={hrefFor(page - 1)} className={`${ITEM} text-accent hover:bg-accent-soft`}>
          Previous
        </Link>
      )}
      {pages.map((n) =>
        n === page ? (
          <span
            key={n}
            aria-current="page"
            className={`${ITEM} bg-accent text-accent-ink font-medium`}
          >
            <span className="sr-only">Page </span>
            {n}
          </span>
        ) : (
          <Link key={n} href={hrefFor(n)} className={`${ITEM} text-ink hover:bg-accent-soft`}>
            <span className="sr-only">Page </span>
            {n}
          </Link>
        ),
      )}
      {page < pageCount && (
        <Link href={hrefFor(page + 1)} className={`${ITEM} text-accent hover:bg-accent-soft`}>
          Next
        </Link>
      )}
    </nav>
  );
}
