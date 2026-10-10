"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { NAV } from "@/lib/site";

/** The main navigation behind a "Menu" button, shown on narrow screens. */
export function MobileMenu() {
  const ref = useRef<HTMLDetailsElement>(null);
  const pathname = usePathname();

  // The header persists across pages, so close the menu when the page changes.
  useEffect(() => {
    ref.current?.removeAttribute("open");
  }, [pathname]);

  useEffect(() => {
    const close = () => ref.current?.removeAttribute("open");
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || !ref.current?.open) return;
      close();
      ref.current.querySelector("summary")?.focus();
    };
    const onPointerDown = (event: PointerEvent) => {
      if (!ref.current?.contains(event.target as Node)) close();
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, []);

  return (
    <details ref={ref} className="relative md:hidden">
      <summary className="border-ink/25 flex min-h-11 cursor-pointer list-none items-center rounded-md border px-3 text-sm font-medium [&::-webkit-details-marker]:hidden">
        Menu
      </summary>
      <nav
        aria-label="Menu"
        className="border-rule bg-surface absolute right-0 z-20 mt-2 flex w-56 flex-col rounded-lg border p-2"
      >
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="hover:bg-accent-soft flex min-h-11 items-center rounded-md px-3 text-sm font-medium"
            onClick={() => ref.current?.removeAttribute("open")}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </details>
  );
}
