import { FREE_SAMPLE_COUNT } from "@/lib/catalog/validate";
import { countWord } from "@/lib/format";
import { CONTACT_LINK, OFFER, SITE } from "@/lib/site";
import type { LegalFacts } from "./facts";
import { link, list, p, type LegalDocument } from "./types";

/**
 * `/refunds`: the refund policy for a digital download. The default is the conservative one for
 * files that cannot be handed back: an order that has not been downloaded can be cancelled, and a
 * file that is faulty or not as described is put right or refunded. It is true with or without a
 * number of days; `refundWindowDays` adds the limit once the owner sets one.
 */
export function refunds(facts: LegalFacts): LegalDocument {
  const mail = link(`mailto:${SITE.contactEmail}`, SITE.contactEmail);
  const samples = countWord(FREE_SAMPLE_COUNT, "capital");
  const days = facts.refundWindowDays;
  const unopened =
    days === undefined
      ? "If you have paid and have not downloaded any of the files, write to us and we will cancel the order and refund it in full."
      : `If you have paid and have not downloaded any of the files, write to us within ${days} days of your purchase and we will cancel the order and refund it in full.`;

  return {
    href: "/refunds",
    title: "Refund policy",
    description: `When a purchase of the ${SITE.name} toolkit can be refunded: before download, and when a file is faulty or not as described.`,
    summary: `The toolkit is a digital download, and a download cannot be handed back. This page says when we refund a purchase and how to ask.`,
    points: [
      "Not downloaded yet: write to us and we refund the order in full.",
      "A file that is faulty or not as described: we fix or replace it, or refund you.",
      "Otherwise a purchase is final once the files are downloaded.",
      `${samples} free samples are on the site so you can judge the toolkit before you buy.`,
    ],
    sections: [
      {
        id: "before-you-buy",
        title: "Before you buy",
        blocks: [
          p(
            `Because a download cannot be returned, we would rather you were sure first. ${samples} complete templates are free to read in the `,
            link("/catalog?free=1", "catalog"),
            ", the ",
            link("/sample", "worked example"),
            " shows how one is put together, and the catalog lists what the full toolkit holds.",
          ),
          p(
            "If you are not sure the toolkit fits your rollout, write to ",
            mail,
            " and ask before you pay.",
          ),
        ],
      },
      {
        id: "not-downloaded",
        title: "If you have not downloaded the files",
        blocks: [p(unopened)],
      },
      {
        id: "after-download",
        title: "After you have downloaded them",
        blocks: [
          p(
            "Once the files are downloaded the purchase is final, and we do not refund it because you changed your mind or no longer need the toolkit. The exceptions are below.",
          ),
        ],
      },
      {
        id: "faulty",
        title: "Faulty, missing or not as described",
        blocks: [
          p("Write to us if:"),
          list(
            "a file will not open or is damaged;",
            "something the site says is included is missing from your download;",
            "what you received is materially different from how the site describes it;",
            "you could not download the files at all;",
            "you were charged twice or charged the wrong amount.",
          ),
          p(
            "We will first try to put it right by sending a working or missing file or correcting the charge. If we cannot, we will refund what you paid.",
          ),
        ],
      },
      {
        id: "how-to-ask",
        title: "How to ask",
        blocks: [
          p(
            "Email ",
            mail,
            " from the address you bought with, give your order reference (it starts with A365 and is on your order and invoice) or the name on the order, and say what went wrong. The ",
            link(CONTACT_LINK.href, "Contact page"),
            " has the same address. If a file is the problem, the file name and what happens when you open it help us fix it quickly.",
          ),
        ],
      },
      {
        id: "how-refunds-are-paid",
        title: "How refunds are paid",
        blocks: [
          p(
            `Refunds go back to the payment method used for the purchase, in the currency it was charged in (${OFFER.currency}). How long the money takes to appear depends on your bank or card issuer. If your bank converted the charge from another currency, the amount you see may differ slightly because exchange rates move.`,
          ),
          p(
            "When an order is refunded, the licence that came with it ends: please delete the files and any copies. The ",
            link("/terms#licence", "licence"),
            " is set out in the Terms.",
          ),
        ],
      },
      {
        id: "your-legal-rights",
        title: "Your legal rights",
        blocks: [
          p(
            "This policy is in addition to any rights the law gives you where you live or do business. Nothing in it limits a right that cannot be waived by agreement.",
          ),
        ],
      },
      {
        id: "today",
        title: "Where the site stands today",
        blocks: [
          p(
            "The site does not take payment yet: the checkout sends us your order by email and charges nothing. We reply with an invoice, and the link to your files follows once it is paid. This policy applies from the first sale, however the toolkit is paid for. If it changes when online payment opens, the date at the top of the page will change with it.",
          ),
          p(
            "See also the ",
            link("/terms", "Terms of use and licence"),
            ", the ",
            link("/privacy", "Privacy policy"),
            " and the ",
            link("/accessibility", "Accessibility statement"),
            ".",
          ),
        ],
      },
    ],
  };
}
