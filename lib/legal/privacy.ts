import { INK_KEY, INTRO_FLAG } from "@/lib/boot/state";
import { DRAFT_KEY } from "@/lib/checkout/draft";
import { CONTACT_LINK, SITE } from "@/lib/site";
import type { LegalFacts } from "./facts";
import { heading, link, list, p, terms, type LegalDocument } from "./types";

/**
 * `/privacy`. Written from what the code does: the site sets no cookie, runs no analytics and has
 * no account or form that sends anything to us; the only things it keeps are three entries in the
 * browser's session storage (two preferences, `lib/boot/state.ts`, and the checkout's draft,
 * `lib/checkout/draft.ts`), and the fonts are served from the site itself. The checkout has no
 * payment provider yet: it writes the order into an email the buyer sends themselves. What changes
 * when a provider is connected stands in a part of its own, so the rest stays true today.
 */
export function privacy(facts: LegalFacts): LegalDocument {
  const host = facts.hostingProvider ?? "our hosting provider";
  const hosted = facts.hostingProvider
    ? `The site is hosted by ${facts.hostingProvider}.`
    : "The site is served by a hosting provider.";
  const mail = link(`mailto:${facts.privacyEmail}`, facts.privacyEmail);
  const answers = facts.privacyContactName
    ? `${facts.privacyContactName} is responsible for privacy at ${facts.entity} and answers these requests.`
    : `The request is answered by the person responsible for privacy at ${facts.entity}.`;

  return {
    href: "/privacy",
    title: "Privacy policy",
    description: `What ${SITE.name} collects, what it keeps in your browser and what it does not do: no cookies, no analytics, no accounts.`,
    summary: `${SITE.name} is built to work without knowing who you are. This page says what the site handles, what it keeps in your browser, and what changes when a checkout opens.`,
    points: [
      "The site sets no cookies and runs no analytics, advertising or tracking scripts.",
      "There are no accounts and no forms that send us anything. We hear from you only when you email us.",
      "What the site keeps in your browser stays in your browser, and is gone when you close the tab.",
      "No payment is taken on the site today, so no payment details are collected.",
    ],
    sections: [
      {
        id: "who-we-are",
        title: "Who we are",
        blocks: [
          p(
            `${SITE.name} is a product of ${facts.entity}, a business based in ${facts.country}. In this policy “we” and “us” mean ${facts.entity}, and “the site” means this website.`,
          ),
          p(
            `We handle personal information under ${facts.country}’s federal private-sector privacy law, the Personal Information Protection and Electronic Documents Act (PIPEDA), and under any provincial privacy law that applies to us.`,
          ),
        ],
      },
      {
        id: "what-we-collect",
        title: "What we collect",
        blocks: [
          p(
            "Very little. You can read every page, browse the catalog and open the free samples without telling us anything about yourself.",
          ),
          terms(
            [
              "Email you send us",
              "If you write to us, we receive your email address, your name if you give it, and whatever you put in the message. We use it to answer you and to follow up on what you asked about.",
            ],
            [
              "An order you send by email",
              "The checkout on the Purchase page can write your order into an email for you to send from your own email program. If you send it, we receive what it contains: your name, email address, organization, country and region, and a purchase order number or a note if you added one. We use it to answer you about the order and, if you buy, to fulfil and record it.",
            ],
            [
              "Technical request data",
              `${hosted} Like any web server, it handles the technical details of each request so that it can send you the page and keep the service running and secure: your IP address, the browser and device type your browser reports, the address of the page asked for, and the time. A catalog search or filter is part of the page’s address, so it is part of that request. We do not use this data to identify you or to build a profile of you.`,
            ],
          ),
          p(
            "We do not buy personal information about you from anyone, and we do not combine what is described here with data from other sources.",
          ),
        ],
      },
      {
        id: "cookies",
        title: "Cookies and browser storage",
        blocks: [
          p(
            "The site sets no cookies, so there is no cookie banner and nothing to accept or decline.",
          ),
          p(
            "It keeps up to three entries in your browser’s session storage. The site never sends them to us or to anyone else, and your browser deletes them when you close the tab. The first two hold no personal information.",
          ),
          terms(
            [
              INTRO_FLAG,
              "Notes that the opening animation of the home page has been shown, so it plays once per visit and not on every page load.",
            ],
            [
              INK_KEY,
              "Remembers whether the ink animation is switched off because your device could not run it smoothly, and the quality level it settled on, so that holds as you move between pages.",
            ],
            [
              DRAFT_KEY,
              "Exists only if you start the checkout. Holds the order details you type there (your name, email address, organization, country and region, and a purchase order number or a note if you add one), so that a refresh or a look at another page does not lose them.",
            ],
          ),
          p(
            "If your browser blocks storage, the site still works: the opening animation is skipped, and the ink choice and the checkout’s details last for one page at a time.",
          ),
        ],
      },
      {
        id: "third-parties",
        title: "Analytics, advertising and other services",
        blocks: [
          list(
            "No analytics or visitor measurement of any kind.",
            "No advertising, remarketing or social media pixels.",
            "No embedded content from other sites, such as videos, maps or chat widgets.",
            "No font service: the two typefaces are served from the site itself, so your browser makes no request to another company to show the text.",
          ),
          p(
            `Every file a page needs comes from the site’s own address. The one company that handles your request is ${host}, as described under “What we collect”.`,
          ),
        ],
      },
      {
        id: "how-we-use-it",
        title: "How we use and share information",
        blocks: [
          p(
            "We use what you send us to answer you, to provide what you asked for, and to keep ordinary business records. We do not sell personal information, rent it, or use it for advertising.",
          ),
          p(
            "We share it only with the service providers that carry it for us, such as our hosting and email providers, who may use it only to provide their service, and when the law requires us to.",
          ),
          p(
            `Some of these providers may store or process data outside ${facts.country}, including in the United States. Information held there is subject to the laws of that place.`,
          ),
        ],
      },
      {
        id: "retention",
        title: "How long we keep it and how we protect it",
        blocks: [
          p(
            "We keep correspondence only for as long as it is needed to deal with your request and to meet our legal and record-keeping obligations. Technical request data is kept by the hosting provider for a limited time under its own retention rules.",
          ),
          p(
            "The site is served over an encrypted connection. No method of sending or storing information is completely secure, so we cannot promise absolute security.",
          ),
        ],
      },
      {
        id: "checkout",
        title: "Buying the toolkit",
        blocks: [
          p(
            "The site does not take payment today. We do not collect card numbers, billing addresses or any other payment details, and the checkout does not ask for them.",
          ),
          p(
            "The checkout takes your order details, keeps them in your browser as described under “Cookies and browser storage”, and offers to put them in an email to us. Nothing reaches us unless you send that email.",
          ),
          heading("when-checkout-opens", "When checkout opens"),
          p(
            "This part describes what is planned for when a payment processor is connected. It is not in effect yet.",
          ),
          list(
            "Card and payment details will be entered with a payment processor and handled by that processor. We will not receive or store full card numbers.",
            "The order details you type will be sent to us when you pay, not only when you choose to email them: your name, your email address, your organization, your country and region for tax, and what you bought.",
            "We will use that information to deliver the files, to send a receipt, to answer questions about the order, and to keep the financial records the law requires.",
          ),
          p(
            "Before the first payment is taken we will update this policy to name the payment processor, list exactly what is collected and say how long order records are kept. The date at the top of the page will change when we do.",
          ),
        ],
      },
      {
        id: "your-rights",
        title: "Your choices and rights",
        blocks: [
          p("You can ask us:"),
          list(
            "whether we hold personal information about you, and for a copy of it;",
            "to correct information that is wrong or out of date;",
            "to delete correspondence we no longer need to keep;",
            "to stop contacting you, which withdraws your consent to further messages.",
          ),
          p(
            "Write to ",
            mail,
            `. ${answers} We may need to confirm who you are before we act on a request.`,
          ),
          p(
            `If you are not satisfied with our answer, you can complain to the Office of the Privacy Commissioner of ${facts.country}, or to the privacy regulator of your province or country.`,
          ),
        ],
      },
      {
        id: "children",
        title: "Children",
        blocks: [
          p(
            "The site is written for people at work who are responsible for a software rollout. It is not directed at children, and we do not knowingly collect information from them.",
          ),
        ],
      },
      {
        id: "changes",
        title: "Changes to this policy",
        blocks: [
          p(
            "When the site changes what it collects or keeps, this page changes first or at the same time, and the date at the top is updated. A material change, such as the opening of the checkout, is described here before it takes effect.",
          ),
        ],
      },
      {
        id: "contact",
        title: "Contact",
        blocks: [
          p(
            "Questions about privacy, and any of the requests above, go to ",
            mail,
            ". You can also reach us from the ",
            link(CONTACT_LINK.href, "Contact page"),
            ".",
          ),
          ...(facts.address ? [p(`${facts.entity}, ${facts.address}.`)] : []),
          p(
            "See also the ",
            link("/terms", "Terms of use and licence"),
            ", the ",
            link("/refunds", "Refund policy"),
            " and the ",
            link("/accessibility", "Accessibility statement"),
            ".",
          ),
        ],
      },
    ],
  };
}
