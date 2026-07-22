import { contact, footer, navItems, siteTagline } from "@/lib/content";
import ToTop from "@/components/fx/ToTop";

/**
 * The drawing's title block: a light, ruled footer plate — identity, index,
 * and contact in three cells — closing on the oversized stroked wordmark.
 * Server component.
 */
export default function Footer() {
  return (
    <footer className="title-block">
      <div className="u-container">
        <div className="tb-grid" style={{ marginInline: "calc(-1 * var(--gutter))" }}>
          <div className="tb-cell">
            <p className="font-display text-xl font-bold uppercase tracking-[-0.03em]">
              ADVANTA
              <span style={{ color: "var(--color-cobalt-deep)" }}>365</span>
            </p>
            <p className="mt-4 max-w-sm text-[0.95rem] leading-relaxed text-ink-muted">
              {footer.blurb}
            </p>
            <a
              href={footer.parent.url}
              target="_blank"
              rel="noopener noreferrer"
              className="link-arrow mt-6"
            >
              {footer.parent.label}
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path
                  d="M3 11 11 3M5 3h6v6"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </a>
          </div>

          <nav className="tb-cell" aria-label="Footer">
            <h2 className="annot mb-4">Index</h2>
            <ul>
              {navItems.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    className="footer-link block border-b border-line py-2.5 text-[0.95rem] font-medium"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="tb-cell">
            <h2 className="annot mb-4">Get in touch</h2>
            <a
              href={`mailto:${contact.email}`}
              className="footer-link break-words text-[0.95rem] font-medium"
            >
              {contact.email}
            </a>
            <div className="mt-8">
              <ToTop />
            </div>
          </div>
        </div>

        <a href="/#top" className="footer-mega mt-4" aria-label="ADVANTA365 — back to top">
          ADVANTA365
        </a>

        <div className="flex flex-col items-start justify-between gap-3 border-t border-line py-6 md:flex-row md:items-center">
          <p className="text-[0.82rem] text-ink-muted">
            © {new Date().getFullYear()} ADVANTA365. All rights reserved.
          </p>
          <p className="annot annot-ink !tracking-[0.12em]">{siteTagline}</p>
        </div>
      </div>
    </footer>
  );
}
