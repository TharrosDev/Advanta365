"use client";

import type { ReactNode } from "react";
import { useReveal } from "@/hooks/useReveal";

/**
 * Client wrapper that arms the IntersectionObserver reveal system for all
 * `[data-reveal]` / `[data-reveal-group]` / `[data-split]` descendants, so
 * content sections themselves can stay server components.
 */
export default function RevealRoot({ children }: { children: ReactNode }) {
  const scope = useReveal<HTMLDivElement>();
  return <div ref={scope}>{children}</div>;
}
