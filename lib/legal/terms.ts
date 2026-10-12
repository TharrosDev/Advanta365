import { formatPrice } from "@/lib/format";
import { CONTACT_LINK, OFFER, SITE } from "@/lib/site";
import type { LegalFacts } from "./facts";
import { link, list, p, type LegalDocument } from "./types";

/**
 * `/terms`: the terms of use of the site and the licence for the toolkit. The licence follows the
 * product as PRODUCT.md describes it: one purchase, files the buyer adapts and keeps, for use
 * inside the buyer's organization. The sentences that name the certifying body are the footer's
 * non-affiliation notice, each whole on a line of its own, as the design gate asks.
 */
export function terms(facts: LegalFacts): LegalDocument {
  const price = formatPrice(OFFER.priceCents, OFFER.currency);
  const mail = link(`mailto:${SITE.contactEmail}`, SITE.contactEmail);
  const law = facts.governingProvince
    ? `These terms are governed by the laws of the Province of ${facts.governingProvince} and the federal laws of ${facts.country} that apply there, and the courts of ${facts.governingProvince} have jurisdiction over any dispute about them.`
    : `These terms are governed by the laws of the province of ${facts.country} in which ${facts.entity} is established and the federal laws of ${facts.country} that apply there, and the courts of that province have jurisdiction over any dispute about them.`;
  const clients = facts.clientWorkAllowed
    ? "If you are a consultant, you may also use the toolkit to prepare deliverables for your clients. The client may use what you deliver; it does not receive the toolkit itself or a licence to it."
    : "The licence covers one organization. If you are a consultant and want to use the toolkit in work for clients, write to us first so we can agree on terms.";

  return {
    href: "/terms",
    title: "Terms of use and licence",
    description: `The terms for using the ${SITE.name} site and the licence for the toolkit: what a buyer may do with the files, what they may not, and who owns them.`,
    summary: `These terms cover two things: using this site, and what you may do with the ${SITE.name} toolkit once you have bought it.`,
    points: [
      "Buy once, then use and adapt the files inside your organization for as long as you like.",
      "Do not resell, share or publish the files outside your organization.",
      `${facts.entity} keeps ownership of the toolkit. What you add to your own copies is yours.`,
      "The toolkit is a starting point from practice, not professional advice for your situation.",
    ],
    sections: [
      {
        id: "agreement",
        title: "About these terms",
        blocks: [
          p(
            `${SITE.name} is a product of ${facts.entity}, a business based in ${facts.country}. In these terms “we” and “us” mean ${facts.entity}; “the site” means this website; and “the toolkit” means the ${SITE.name} documents we sell, including the free samples shown on the site.`,
          ),
          p(
            "By using the site you agree to the parts of these terms about the site. By buying the toolkit you agree to all of them, on behalf of the organization you are buying for. If you do not agree, do not use the site or buy the toolkit.",
          ),
        ],
      },
      {
        id: "the-site",
        title: "Using the site",
        blocks: [
          p(
            "The site describes the toolkit and shows part of it. You may browse it, link to it and share its pages. Please do not copy its content in bulk, interfere with how it runs, or try to get at files that are locked.",
          ),
          p(
            "The catalog on the site is a sample of the toolkit and is still being completed. We may change, add or remove pages, samples and descriptions at any time.",
          ),
        ],
      },
      {
        id: "buying",
        title: "Buying the toolkit",
        blocks: [
          p(
            `The toolkit is sold as one purchase at ${price}. It is not a subscription and there are no recurring charges. Prices are in Canadian dollars; any sales tax that applies is added before you pay.`,
          ),
          p(
            "The toolkit is delivered as downloadable files. Nothing is shipped. The site does not take payment yet: the checkout on the ",
            link("/purchase", "Purchase page"),
            " takes your order details and offers to send them to us by email, and we answer you from there. An order sent this way is a request, not a charge.",
          ),
          p(
            "We may change the price or the contents of the toolkit for future purchases. A change does not affect an order you have already paid for.",
          ),
        ],
      },
      {
        id: "licence",
        title: "Your licence: what you may do",
        blocks: [
          p(
            "When you have paid for the toolkit, we grant the organization you bought it for a licence to use it. The licence is non-exclusive, cannot be transferred, and does not expire. Under it you may:",
          ),
          list(
            "download the files and keep copies, including backups;",
            "edit, rewrite, rebrand, translate and combine the files to fit your organization;",
            "share the files and what you make from them with the employees and contractors of your organization, for its own work;",
            "deliver what you make from them, such as communications, training and plans, to the people in your organization that a rollout reaches;",
            "use AI tools to adapt the files for these purposes.",
          ),
          p(clients),
          p(
            "The free samples on the site may be read and used to judge whether the toolkit suits you, under the same limits as the rest of the toolkit.",
          ),
        ],
      },
      {
        id: "restrictions",
        title: "What you may not do",
        blocks: [
          p("You may not:"),
          list(
            "resell, sublicense, rent or give away the toolkit or any substantial part of it, whether changed or not;",
            "share the files outside your organization, or post them anywhere the public or another organization can reach them;",
            "sell or distribute templates, courses or other products that are built from the toolkit;",
            "use the toolkit to build a dataset or a model that is offered to others, or a product that competes with it;",
            "remove a copyright or ownership notice from a file you pass on in a form that is substantially ours.",
          ),
          p(
            "If these terms are broken in a serious way, we may end the licence by writing to you. You must then stop using the toolkit and delete your copies. Deliverables you have already issued inside your organization are not affected.",
          ),
        ],
      },
      {
        id: "ownership",
        title: "Ownership",
        blocks: [
          p(
            `The toolkit, the site, their text, design and structure, and the ${SITE.name} name and mark belong to ${facts.entity} and are protected by copyright and other laws. Buying the toolkit gives you the licence above. It does not transfer ownership of the toolkit to you.`,
          ),
          p(
            "What you add is yours: your organization’s names, facts, decisions, branding and any new material you write. We claim no rights in it, and we do not ask to see it.",
          ),
        ],
      },
      {
        id: "no-advice",
        title: "Not professional advice",
        blocks: [
          p(
            "The toolkit is a set of working documents drawn from practice. It is general material, written without knowledge of your organization, and it is meant to be adapted by someone who knows it.",
          ),
          p(
            "It is not legal, employment, privacy, records management, security, financial or other professional advice, and it does not replace a qualified adviser. You are responsible for checking that what you adapt and issue is accurate and suitable for your organization, and for the decisions you make with it.",
          ),
          p(
            "We do not promise a particular result. How well a rollout is adopted depends on many things that the toolkit does not control.",
          ),
        ],
      },
      {
        id: "trademarks",
        title: "Trademarks and independence",
        blocks: [
          p(
            `${SITE.name} and ${facts.entity} are independent and are not affiliated with or endorsed by Prosci Inc. or Microsoft Corporation.`,
          ),
          p("Prosci is a registered trademark of Prosci Inc."),
          p(
            "Microsoft 365, SharePoint and Copilot are trademarks of the Microsoft group of companies.",
          ),
          p(
            "These and other product names are used on the site and in the toolkit only to say what the content is about. The licence gives you no right to use our name or mark, or anyone else’s, beyond that.",
          ),
        ],
      },
      {
        id: "warranty",
        title: "Warranty and liability",
        blocks: [
          p(
            "We take care that the files open, are complete and match their description on the site. If a file is faulty or not as described, the ",
            link("/refunds", "Refund policy"),
            " says what we will do.",
          ),
          p(
            "Beyond that, and as far as the law allows, the site and the toolkit are provided as they are, without warranties of any kind, including that they are fit for a particular purpose or free of errors.",
          ),
          p(
            "As far as the law allows, we are not liable for indirect or consequential loss, such as lost profit, lost data or the cost of a delayed project, and our total liability for any claim about the toolkit is limited to the amount you paid for it.",
          ),
          p(
            "Nothing in these terms takes away a right that the law of the place you live or do business gives you and that cannot be waived by agreement.",
          ),
        ],
      },
      {
        id: "changes",
        title: "Changes to these terms",
        blocks: [
          p(
            "We may update these terms. The date at the top of the page shows when they last changed. The licence you receive is the one in force on the day you buy; a later change does not reduce what it allows you to do.",
          ),
        ],
      },
      {
        id: "law",
        title: "Governing law",
        blocks: [p(law)],
      },
      {
        id: "contact",
        title: "Contact",
        blocks: [
          p(
            "Questions about these terms, or about a use the licence does not clearly cover, go to ",
            mail,
            " or the ",
            link(CONTACT_LINK.href, "Contact page"),
            ".",
          ),
          ...(facts.address ? [p(`${facts.entity}, ${facts.address}.`)] : []),
          p(
            "See also the ",
            link("/privacy", "Privacy policy"),
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
