import { CONTACT_LINK, SITE } from "@/lib/site";
import { formatLegalDate, type LegalFacts } from "./facts";
import { link, list, p, type LegalDocument } from "./types";

/**
 * `/accessibility`: the accessibility statement. Every line under "What the site does" is a rule
 * the code keeps and a test checks (docs/design-system.md, section 12, and docs/testing.md); the
 * limits are the ones known today. It claims a target, not a certificate.
 */
export function accessibility(facts: LegalFacts): LegalDocument {
  const mail = link(`mailto:${SITE.contactEmail}`, SITE.contactEmail);
  const assessed = facts.accessibilityAuditDate
    ? `The site was last assessed by an independent auditor on ${formatLegalDate(facts.accessibilityAuditDate)}. Between audits this statement is kept up to date from our own checks.`
    : "This statement is our own assessment, made from how the site is built and tested. It is not the result of an independent audit.";

  return {
    href: "/accessibility",
    title: "Accessibility statement",
    description: `How the ${SITE.name} site is built to be usable by everyone: the standard it aims for, what it does, where it falls short and how to report a barrier.`,
    summary: `We want everyone responsible for a rollout to be able to read this site and judge the toolkit, whatever device or assistive technology they use.`,
    points: [
      "The site aims to meet WCAG 2.2 at level AA.",
      "Everything works with a keyboard, and nothing depends on animation.",
      "Motion is small and short, and nothing moves by itself if you ask your system for less motion.",
      "If something gets in your way, tell us and we will fix it or get you the content another way.",
    ],
    sections: [
      {
        id: "standard",
        title: "The standard we aim for",
        blocks: [
          p(
            "Our target is the Web Content Accessibility Guidelines (WCAG) 2.2 at level AA, for every page of the site. We treat it as a floor that each change has to keep, not as a finished state, and we do not claim that every page meets every criterion.",
          ),
          p(assessed),
        ],
      },
      {
        id: "what-the-site-does",
        title: "What the site does",
        blocks: [
          list(
            "Keyboard: every link, button, filter, menu and pop-up can be reached and used with the keyboard alone, in the order it is read. A “Skip to content” link is the first stop on every page.",
            "Focus: the element that has keyboard focus is outlined with a 3-pixel ring in ink, or in light blue on the dark footer. Headings you jump to stop clear of the bar at the top instead of under it.",
            "Structure: each page has one main heading, one banner, one main region and one footer, and every navigation has a name. The current page is marked for assistive technology.",
            "Pop-ups: the menu, the filter sheet and the sample pop-up are native dialogs. Focus moves into them, Escape closes them, and focus goes back to where you were.",
            "Contrast: body and heading text is at least 4.5 to 1 against its ground, and the borders of controls at least 3 to 1. The light blue is never the only sign of a state; it always carries ink as well.",
            "Text size: sizes are set relative to your browser’s own text size, so your setting is respected, and pages reflow to a 320-pixel-wide window without scrolling sideways.",
            "Targets: on phones and tablets, buttons and stand-alone links are at least 44 pixels tall.",
            "Colour modes: when you ask your system for more contrast, or use forced colours, shadows become solid lines.",
            "Without JavaScript: pages are sent complete from the server, so their content can be read, their links work and the free samples open.",
            "Language: pages are marked as English so screen readers pronounce them correctly.",
          ),
        ],
      },
      {
        id: "motion",
        title: "Motion",
        blocks: [
          list(
            "If your system is set to reduce motion, nothing on the site moves by itself: the opening animation does not play and content does not animate in.",
            "The first visit to the home page opens with a short animation of the logo, about three seconds long. Any key, press, tap or turn of the wheel ends it at once.",
            "A locked template in the catalog shakes for about half a second when it is pressed, to say it is locked. With reduced motion it does not move, and a line of text says the same thing.",
            "No animation on the site loops without end, and none flashes.",
          ),
        ],
      },
      {
        id: "limitations",
        title: "Known limitations",
        blocks: [
          p("We know about these gaps and would rather say so than have you find them:"),
          list(
            "The toolkit’s files are Word, PowerPoint, Excel and PDF documents meant to be edited. We have not checked each one against a document accessibility standard, and how accessible your adapted versions are depends on the changes you make.",
            "We have not tested every page with every combination of screen reader, browser and voice control software, so a fault may exist that our checks did not find.",
            "The covers of templates in the catalog are small pictures of a page. Their content is decoration; each template’s title, description and details are given as text beside the cover.",
            "On phones, the row of rollout phases in the catalog scrolls sideways. Every phase in it can be reached by touch and with the keyboard, but it is one place where content runs past the edge of the screen on purpose.",
            "Without JavaScript, controls that open a panel, such as the phone menu and the catalog’s filter sheet, may not respond. The pages and their links still work.",
            "The site is in English only.",
            "The checkout does not take payment yet. The payment step that a processor will add is not built, and will be held to the same standard and covered by this statement when it is.",
          ),
        ],
      },
      {
        id: "how-we-check",
        title: "How we check",
        blocks: [
          p(
            "Accessibility is checked as the site is built, not afterwards. Automated tests run in desktop and phone browsers. Among other things they check for one main heading per page, visible focus rings, target sizes, pages that fit windows from 320 pixels wide up to large monitors, and that the site is complete and still with reduced motion, with more contrast and without JavaScript.",
          ),
          p(
            "A further check stops colours from being written outside the one set whose contrast has been measured.",
          ),
        ],
      },
      {
        id: "report",
        title: "Report a barrier",
        blocks: [
          p(
            "If any part of the site is hard or impossible for you to use, or you need something from it in another form, write to ",
            mail,
            " or use the ",
            link(CONTACT_LINK.href, "Contact page"),
            ". It helps to tell us:",
          ),
          list(
            "the address of the page;",
            "what you were trying to do and what happened;",
            "the browser and any assistive technology you were using.",
          ),
          p(
            "A barrier that stops someone from using the site is treated as a fault to fix, not as a request.",
          ),
        ],
      },
      {
        id: "about-this-statement",
        title: "About this statement",
        blocks: [
          p(
            `This statement covers the ${SITE.name} website. It is reviewed when the site changes in a way that affects it, and the date at the top of the page shows when it last changed.`,
          ),
          p(
            "See also the ",
            link("/privacy", "Privacy policy"),
            ", the ",
            link("/terms", "Terms of use and licence"),
            " and the ",
            link("/refunds", "Refund policy"),
            ".",
          ),
        ],
      },
    ],
  };
}
