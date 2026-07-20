# Advanta365

Marketing site for ADVANTA365 — the enterprise Microsoft 365 adoption,
governance, and enablement framework from Echofive Solutions.

A one-page cinematic narrative in the "Day Grid" design system — the light,
government-facing polarity of the Echofive parent site's "Bone & Cobalt".
See `DESIGN.md` for the system reference.

## Stack

- Next.js 16 (App Router), React 19, TypeScript strict
- Tailwind CSS v4 (tokens in `app/globals.css` `@theme`)
- GSAP + ScrollTrigger (additive scrub only) and Lenis smooth scroll
- Raw 2D-canvas hero field (no WebGL dependency)
- pnpm

## Local development

```sh
pnpm install
pnpm dev          # http://localhost:3000
pnpm typecheck    # tsc --noEmit
pnpm build
```

## Structure

```
app/              App Router pages, layout, globals.css (design system)
components/
  sections/       Page narrative sections (server where possible)
  fx/             Motion pieces: GridField, Marquee, TextScrub, counters
  providers/      Lenis smooth scroll
  ui/             RevealRoot, SplitText, SectionHeading
hooks/            useReveal (IntersectionObserver reveal system)
lib/              content.ts (all copy), seo.ts, gsap.ts, splitText.ts
public/           Static assets
```

## Deploy

Vercel auto-detects Next.js. No `vercel.json` required.
