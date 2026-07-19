import { contact, footer, navItems, siteTagline } from "@/lib/content";
import ToTop from "@/components/fx/ToTop";

/**
 * Deep-abyss close: oversized stroked wordmark, index links, and the
 * Echofive family credit. Server component.
 */
export default function Footer() {
  return (
    <footer className="bg-abyss text-bone">
      <div className="u-container pt-16 md:pt-24">
        <div className="grid gap-12 pb-16 md:grid-cols-12 md:gap-8">
          <div className="md:col-span-5">
            <p
              className="font-display text-xl font-bold uppercase"
              style={{ fontVariationSettings: '"wdth" 125' }}
            >
              ADVANTA<span className="cobalt">365</span>
            </p>
            <p className="mt-5 max-w-sm text-[0.95rem] leading-relaxed text-bone-muted">
              {footer.blurb}
            </p>
            <a
              href={footer.parent.url}
              target="_blank"
              rel="noopener noreferrer"
              className="link-arrow mt-7"
            >
              {footer.parent.label}
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path
                  d="M3 11 11 3M5 3h6v6"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </a>
          </div>

          <nav className="md:col-span-4" aria-label="Footer">
            <h2 className="t-coord mb-5">Index</h2>
            <ul className="border-t border-line">
              {navItems.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    className="footer-link flex items-baseline gap-4 border-b border-line py-2.5"
                  >
                    <span className="t-coord tabular-nums !text-inherit">
                      {item.index}
                    </span>
                    <span className="text-[0.95rem] font-medium">{item.label}</span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="md:col-span-3">
            <h2 className="t-coord mb-5">Get in touch</h2>
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

        <a href="/#top" className="footer-mega" aria-label="ADVANTA365 — back to top">
          ADVANTA365
        </a>

        <div className="flex flex-col items-start justify-between gap-3 border-t border-line py-6 md:flex-row md:items-center">
          <p className="t-coord normal-case tracking-normal !text-bone-muted">
            © {new Date().getFullYear()} ADVANTA365. All rights reserved.
          </p>
          <p className="t-coord !text-bone-muted">{siteTagline}</p>
        </div>
      </div>
    </footer>
  );
}
