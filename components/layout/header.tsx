import Link from "next/link";
import type { ReactNode } from "react";
import type { Phase } from "@/lib/catalog/schema";
import { NAV, SITE } from "@/lib/site";
import { Container } from "./container";

const NAV_LINK = "rounded-sm py-2 text-sm font-medium text-ink underline-offset-8 hover:underline";

function Logo() {
  return (
    <Link href="/" className="font-display text-ink text-2xl font-semibold tracking-tight">
      Advanta<span className="text-accent">365</span>
      <span className="sr-only"> — {SITE.tagline}</span>
    </Link>
  );
}

export function Header({ phases, cart }: { phases: Phase[]; cart: ReactNode }) {
  return (
    <header className="border-rule bg-surface border-b">
      <Container className="flex min-h-16 items-center justify-between gap-4">
        <Logo />
        <nav aria-label="Main" className="hidden items-center gap-7 md:flex">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className={NAV_LINK}>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          {cart}
          <details className="group relative md:hidden">
            <summary className="border-ink/25 flex min-h-11 cursor-pointer list-none items-center rounded-md border px-3 text-sm font-medium [&::-webkit-details-marker]:hidden">
              Menu
            </summary>
            <nav
              aria-label="Main"
              className="border-rule bg-surface absolute right-0 z-20 mt-2 flex w-56 flex-col rounded-lg border p-2 shadow-lg"
            >
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="hover:bg-accent-soft flex min-h-11 items-center rounded-md px-3 text-sm font-medium"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </details>
        </div>
      </Container>

      <div className="border-rule bg-bg border-t">
        <Container>
          <nav
            aria-label="Rollout phases"
            className="flex items-center gap-x-1 overflow-x-auto py-1 text-sm"
          >
            <span className="text-muted mr-2 hidden shrink-0 sm:inline">Browse by phase</span>
            {phases.map((phase, index) => (
              <Link
                key={phase.slug}
                href={`/phases/${phase.slug}`}
                className="text-ink hover:bg-accent-soft flex min-h-10 shrink-0 items-center gap-2 rounded-md px-2 font-medium"
              >
                <span className="font-display text-accent tabular-nums">{index + 1}</span>
                {phase.name}
              </Link>
            ))}
          </nav>
        </Container>
      </div>
    </header>
  );
}
