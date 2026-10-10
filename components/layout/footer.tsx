import Link from "next/link";
import type { Phase } from "@/lib/catalog/schema";
import { SITE } from "@/lib/site";
import { Container } from "./container";

const LINK =
  "inline-flex min-h-9 items-center text-sm text-muted underline-offset-4 hover:text-ink hover:underline";

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { href: string; label: string }[];
}) {
  return (
    <div>
      <h2 className="text-ink font-sans text-sm font-semibold tracking-normal">{title}</h2>
      <ul className="mt-3">
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className={LINK}>
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Footer({ phases }: { phases: Phase[] }) {
  return (
    <footer className="border-rule bg-surface mt-24 border-t">
      <Container className="grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr]">
        <div>
          <p className="font-display text-xl font-semibold">
            Advanta<span className="text-accent">365</span>
          </p>
          <p className="text-muted mt-3 max-w-sm text-sm">{SITE.description}</p>
        </div>
        <FooterColumn
          title="By phase"
          links={phases.map((phase) => ({ href: `/phases/${phase.slug}`, label: phase.name }))}
        />
        <FooterColumn
          title="Browse"
          links={[
            { href: "/catalog", label: "All templates" },
            { href: "/bundles", label: "Bundles" },
            { href: "/pricing", label: "Pricing" },
          ]}
        />
        <FooterColumn
          title="Company"
          links={[
            { href: "/about", label: "About" },
            { href: "/contact", label: "Contact" },
          ]}
        />
      </Container>
      <div className="border-rule border-t">
        <Container className="text-muted py-6 text-xs">
          <p>
            © {new Date().getFullYear()} {SITE.name}. Templates are aligned with Prosci methodology.{" "}
            {SITE.name} is an independent provider and is not affiliated with or endorsed by Prosci
            Inc. or Microsoft Corporation. Microsoft 365 and SharePoint are trademarks of the
            Microsoft group of companies.
          </p>
        </Container>
      </div>
    </footer>
  );
}
