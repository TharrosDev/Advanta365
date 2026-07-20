"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { navItems } from "@/lib/content";
import { useSmoothScroll } from "@/components/providers/SmoothScroll";

function Wordmark() {
  return (
    <a
      href="/#top"
      className="font-display text-lg font-bold uppercase tracking-tight md:text-xl"
      style={{ fontVariationSettings: '"wdth" 125' }}
      aria-label="ADVANTA365 home"
    >
      ADVANTA<span className="cobalt">365</span>
    </a>
  );
}

/**
 * Fixed site nav: transparent over the hero, solid + blurred once scrolled,
 * hides on scroll-down / returns on scroll-up. Desktop links carry mono
 * superscript indices and a scrollspy underline; mobile gets a full-screen
 * abyss overlay with focus trap and Esc-to-close.
 */
export default function Nav() {
  const [hidden, setHidden] = useState(false);
  const [solid, setSolid] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<string>("");
  const pathname = usePathname();
  const { scrollTo, stop, start } = useSmoothScroll();
  const navRef = useRef<HTMLElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  // Hide on scroll down, show on scroll up; solid once past the fold edge.
  useEffect(() => {
    let lastY = window.scrollY;
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const y = window.scrollY;
        setSolid(y > 24);
        setHidden(y > 140 && y > lastY);
        lastY = y;
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  // Scrollspy: watch the sections the nav points at.
  useEffect(() => {
    if (pathname !== "/") return;
    const ids = navItems
      .map(n => n.href.split("#")[1])
      .filter((id): id is string => Boolean(id));
    const sections = ids
      .map(id => document.getElementById(id))
      .filter((el): el is HTMLElement => Boolean(el));
    if (!sections.length) return;

    const io = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id);
        }
      },
      { rootMargin: "-38% 0px -56% 0px", threshold: 0 }
    );
    sections.forEach(s => io.observe(s));
    return () => io.disconnect();
  }, [pathname]);

  // Mobile menu: scroll lock, focus trap, Esc.
  useEffect(() => {
    if (!open) return;
    // Lenis ignores CSS overflow locks (it drives wheel scroll itself), so
    // the instance is stopped for the lock to actually hold.
    stop();
    const previousBody = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const first = panelRef.current?.querySelector<HTMLElement>("a, button");
    first?.focus();

    // The nav bar (wordmark, CTA, close toggle) stays visible *above* the
    // overlay, so the trap must cycle through it too — otherwise keyboard
    // users can see the close button but never reach it.
    const getFocusables = () => {
      const sel = "a[href], button:not([disabled])";
      return [
        ...(navRef.current?.querySelectorAll<HTMLElement>(sel) ?? []),
        ...(panelRef.current?.querySelectorAll<HTMLElement>(sel) ?? []),
      ].filter(el => el.getClientRects().length > 0);
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        return;
      }
      if (e.key !== "Tab") return;
      const focusables = getFocusables();
      if (focusables.length === 0) return;
      const firstEl = focusables[0];
      const lastEl = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === firstEl) {
        e.preventDefault();
        lastEl.focus();
      } else if (!e.shiftKey && document.activeElement === lastEl) {
        e.preventDefault();
        firstEl.focus();
      }
    };
    document.addEventListener("keydown", onKey);

    // If the viewport grows past the desktop breakpoint the panel is hidden
    // by CSS but `open` would stay true — leaving scroll locked forever.
    const mq = window.matchMedia("(min-width: 1024px)");
    const onBreakpoint = (e: MediaQueryListEvent) => {
      if (e.matches) setOpen(false);
    };
    mq.addEventListener("change", onBreakpoint);

    return () => {
      mq.removeEventListener("change", onBreakpoint);
      document.body.style.overflow = previousBody;
      document.removeEventListener("keydown", onKey);
      start();
      toggleRef.current?.focus();
    };
  }, [open, stop, start]);

  const onAnchorClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string
  ) => {
    const hash = href.includes("#") ? `#${href.split("#")[1]}` : null;
    if (!hash || pathname !== "/") return; // normal navigation elsewhere
    e.preventDefault();
    setOpen(false);
    // Release the menu's scroll lock *before* scrolling: a later
    // `lenis.start()` resets the instance and would cancel an in-flight
    // scrollTo. Starting first makes the cleanup's start() a no-op.
    start();
    history.pushState(null, "", hash);
    scrollTo(hash);
  };

  return (
    <>
      <nav
        ref={navRef}
        className={`site-nav${solid || open || pathname !== "/" ? " is-solid" : ""}${
          hidden && !open ? " nav-hidden" : ""
        }`}
        aria-label="Primary"
      >
        <div
          className="u-container flex items-center justify-between"
          style={{ height: "var(--nav-h)" }}
        >
          <Wordmark />

          <div className="hidden items-center gap-8 lg:flex">
            {navItems.map(item => (
              <a
                key={item.href}
                href={item.href}
                onClick={e => onAnchorClick(e, item.href)}
                className="nav-link font-mono text-[0.8rem] tracking-[0.06em] uppercase"
                data-active={
                  active && item.href.endsWith(`#${active}`) ? "" : undefined
                }
              >
                <sup className="nav-index" aria-hidden="true">
                  {item.index}
                </sup>
                {item.label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <a
              href="/#contact"
              onClick={e => onAnchorClick(e, "/#contact")}
              className="btn btn-primary hidden !px-5 !py-3 sm:inline-flex"
            >
              Talk to us
            </a>
            <button
              ref={toggleRef}
              type="button"
              className="grid h-11 w-11 place-items-center text-bone lg:hidden"
              onClick={() => setOpen(v => !v)}
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              aria-controls="mobile-menu"
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 22 22"
                fill="none"
                aria-hidden="true"
              >
                {open ? (
                  <path
                    d="M4 4l14 14M18 4L4 18"
                    stroke="currentColor"
                    strokeWidth="1.6"
                  />
                ) : (
                  <path
                    d="M2 6h18M2 11h18M2 16h18"
                    stroke="currentColor"
                    strokeWidth="1.6"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {/* Rendered as a sibling of the nav, never inside it: the solid nav's
        backdrop-filter makes it the containing block for fixed descendants,
        which would clip this full-screen panel to the nav bar's box. */}
      {open && (
        <div
          id="mobile-menu"
          ref={panelRef}
          className="mobile-menu lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Site menu"
        >
          <div className="flex flex-col">
            {navItems.map(item => (
              <a
                key={item.href}
                href={item.href}
                onClick={e => onAnchorClick(e, item.href)}
                className="mobile-link"
              >
                <span className="t-coord" aria-hidden="true">
                  {item.index}
                </span>
                {item.label}
              </a>
            ))}
          </div>
          <a
            href="/#contact"
            onClick={e => onAnchorClick(e, "/#contact")}
            className="btn btn-primary mt-8 self-start"
          >
            Talk to us
          </a>
        </div>
      )}
    </>
  );
}
