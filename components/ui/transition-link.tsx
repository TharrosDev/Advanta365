import Link from "next/link";
import type { ComponentProps } from "react";

/**
 * The site's internal link: `next/link` with prefetching on by default, and nothing else. It has no
 * state and no effect, so server components can render it. This is the only file that imports
 * `next/link`; every other link goes through it or through a primitive built on it.
 */
export function TransitionLink({ prefetch = true, ...rest }: ComponentProps<typeof Link>) {
  return <Link {...rest} prefetch={prefetch} />;
}
