"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { navItems } from "@/lib/content";
import { cn } from "@/lib/utils";

interface SiteLayoutProps {
  children: React.ReactNode;
}

function Wordmark({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn("group inline-flex items-center gap-2.5", className)}
      aria-label="ADVANTA365 home"
    >
      <span
        aria-hidden
        className="relative grid h-8 w-8 place-items-center border border-ink bg-paper-panel md:h-9 md:w-9"
        style={{ borderRadius: "2px" }}
      >
        <span className="font-display text-base font-bold leading-none text-ink md:text-lg">A</span>
        <span className="absolute inset-x-1 bottom-1.5 h-[2px] bg-primary" />
      </span>
      <span className="font-display text-lg font-bold tracking-tight md:text-xl">
        <span className="text-ink">ADVANTA</span>
        <span className="text-primary">365</span>
      </span>
    </Link>
  );
}

export default function SiteLayout({ children }: SiteLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const panelRef = useRef<HTMLDivElement | null>(null);
  const toggleRef = useRef<HTMLButtonElement | null>(null);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  // Body scroll-lock, Esc-to-close, focus management while mobile menu open
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const firstLink = panelRef.current?.querySelector<HTMLElement>("a, button");
    firstLink?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMobileMenuOpen(false);
        return;
      }
      if (e.key !== "Tab") return;
      const focusables = panelRef.current?.querySelectorAll<HTMLElement>(
        "a[href], button:not([disabled])",
      );
      if (!focusables || focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKey);
      toggleRef.current?.focus();
    };
  }, [mobileMenuOpen]);

  // Close menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60] focus:bg-ink focus:px-3 focus:py-2 focus:text-paper"
      >
        Skip to content
      </a>

      {/* Header — solid drafting bar with a structural baseline rule */}
      <header className="sticky top-0 z-50 border-b border-rule-strong bg-background">
        <div className="container flex h-16 items-center justify-between md:h-[4.5rem]">
          <Wordmark />

          {/* Desktop nav */}
          <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
            {navItems.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative px-3 py-2 text-sm font-medium transition-colors",
                    active ? "text-ink" : "text-ink-2 hover:text-ink",
                  )}
                >
                  {item.label}
                  <span
                    aria-hidden
                    className={cn(
                      "absolute inset-x-3 -bottom-px h-[2px] origin-left transition-transform duration-200",
                      active ? "scale-x-100 bg-primary" : "scale-x-0 bg-ink",
                    )}
                  />
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2 md:gap-3">
            <Link href="/contact" className="hidden sm:inline-flex">
              <Button size="sm" className="gap-1.5">
                Talk to us
                <ArrowUpRight className="h-4 w-4" />
              </Button>
            </Link>

            <button
              ref={toggleRef}
              className="grid h-11 w-11 place-items-center text-ink transition-colors hover:bg-secondary lg:hidden"
              onClick={() => setMobileMenuOpen((v) => !v)}
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <>
          <button
            type="button"
            aria-label="Close menu"
            tabIndex={-1}
            className="fixed inset-0 z-40 bg-ink/40 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div
            id="mobile-menu"
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Site menu"
            className="fixed inset-x-0 top-0 z-50 border-b border-rule-strong bg-background pt-16 shadow-[0_24px_48px_-24px_rgba(40,36,30,0.35)] md:pt-[4.5rem] lg:hidden"
          >
            <nav className="container flex flex-col py-4" aria-label="Mobile">
              {navItems.map((item, idx) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-baseline gap-4 border-b border-rule py-3.5 transition-colors",
                      active ? "text-ink" : "text-ink-2 hover:text-ink",
                    )}
                  >
                    <span className="mono-label w-6 shrink-0 tabular-nums">
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                    <span className="font-display text-lg font-semibold">{item.label}</span>
                    {active && <span aria-hidden className="ml-auto h-2 w-2 self-center bg-primary" />}
                  </Link>
                );
              })}
              <div className="pt-5">
                <Link href="/contact">
                  <Button className="w-full gap-2">
                    Talk to us
                    <ArrowUpRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </nav>
          </div>
        </>
      )}

      <main id="main" className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-rule-strong bg-secondary">
        <div className="container py-14 md:py-20">
          <div className="grid grid-cols-1 gap-10 md:grid-cols-12 md:gap-8">
            <div className="md:col-span-5">
              <Wordmark />
              <p className="body-base mt-5 max-w-md text-ink-2">
                Enterprise Microsoft 365 adoption, governance, and enablement framework — for large,
                complex, regulated organizations.
              </p>
            </div>

            <nav className="md:col-span-4" aria-label="Footer">
              <h4 className="mono-label mb-5">Index</h4>
              <ul className="border-t border-rule">
                {navItems.map((item, idx) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="flex items-baseline gap-4 border-b border-rule py-2.5 text-ink-2 transition-colors hover:text-ink"
                    >
                      <span className="mono-label tabular-nums">{String(idx + 1).padStart(2, "0")}</span>
                      <span className="text-[0.95rem] font-medium">{item.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="md:col-span-3">
              <h4 className="mono-label mb-5">Get in touch</h4>
              <p className="body-base mb-5 text-ink-2">
                Start a conversation about your Microsoft 365 program.
              </p>
              <Link href="/contact">
                <Button className="gap-1.5">
                  Talk to us
                  <ArrowUpRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>

          <div className="mt-12 flex flex-col items-start justify-between gap-3 border-t border-rule pt-6 md:flex-row md:items-center">
            <p className="mono-label normal-case tracking-normal">
              © {new Date().getFullYear()} ADVANTA365. All rights reserved.
            </p>
            <p className="mono-label">Enterprise Microsoft 365 Framework</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
