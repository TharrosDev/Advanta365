"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ComponentProps, MouseEvent } from "react";
import { coverPage } from "./page-fade";

export type TransitionLinkProps = ComponentProps<typeof Link> & { fade?: boolean };

type Href = TransitionLinkProps["href"];

/**
 * The pathname a fade may run for: the href when it is root-relative, without its query and hash.
 * Null for everything that must behave like a plain link: external, mailto:, hash-only,
 * protocol-relative.
 */
function fadePath(href: Href): string | null {
  const raw = typeof href === "string" ? href : (href.pathname ?? "");
  if (!raw.startsWith("/") || raw.startsWith("//")) return null;
  const end = raw.search(/[?#]/);
  const path = end === -1 ? raw : raw.slice(0, end);
  // "/catalog/" is the page "/catalog": compare it the way the router reports the pathname.
  return path.length > 1 && path.endsWith("/") ? path.replace(/\/+$/, "") || "/" : path;
}

/** The URL handed to the router: the href as written, or the object form put back together. */
function hrefToString(href: Href, path: string): string {
  if (typeof href === "string") return href;
  if (href.href) return href.href;

  let search = href.search ?? "";
  if (!search && href.query) {
    if (typeof href.query === "string") {
      search = href.query;
    } else {
      const params = new URLSearchParams();
      for (const [key, value] of Object.entries(href.query)) {
        if (value === undefined || value === null) continue;
        const values: readonly unknown[] = Array.isArray(value) ? value : [value];
        for (const item of values) params.append(key, String(item));
      }
      search = params.toString();
    }
  }
  if (search && !search.startsWith("?")) search = `?${search}`;

  let hash = href.hash ?? "";
  if (hash && !hash.startsWith("#")) hash = `#${hash}`;

  return `${path}${search}${hash}`;
}

/**
 * Drop-in for `next/link` (the only file that imports it). A plain left click on a link to another
 * internal pathname first fades the page out (`coverPage`, 300ms) and then navigates; `PageFade`
 * lifts the cover when the new pathname commits.
 *
 * The fade is skipped, and `next/link` behaves as usual, for: `fade={false}`, a click the caller
 * already handled (`preventDefault`), modified or non-primary clicks, a `target` other than
 * `_self`, hrefs that are not root-relative, and links whose pathname is the current one (filters,
 * pagination, in-page anchors).
 */
export function TransitionLink({
  fade = true,
  prefetch = true,
  replace = false,
  href,
  scroll,
  target,
  onClick,
  ...rest
}: TransitionLinkProps) {
  const router = useRouter();
  const pathname = usePathname();

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);

    if (!fade || event.defaultPrevented || event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (target && target !== "_self") return;

    const path = fadePath(href);
    if (!path || path === pathname) return;

    // Also stops next/link's own handler, which bails out on a prevented event.
    event.preventDefault();
    const destination = hrefToString(href, path);
    void coverPage().then(() => {
      if (replace) router.replace(destination, { scroll });
      else router.push(destination, { scroll });
    });
  };

  return (
    <Link
      {...rest}
      href={href}
      prefetch={prefetch}
      replace={replace}
      scroll={scroll}
      target={target}
      onClick={handleClick}
    />
  );
}
