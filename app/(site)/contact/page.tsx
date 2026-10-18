import type { Metadata } from "next";
import { ContactSection } from "@/components/contact/contact-section";
import { JsonLd } from "@/components/seo/json-ld";
import { pageMetadata } from "@/lib/seo/metadata";
import { graph, IDS, webPage } from "@/lib/seo/structured-data";
import { SITE } from "@/lib/site";

const DESCRIPTION = `Write to ${SITE.name} at ${SITE.contactEmail}: questions before you buy, purchase orders and invoices, orders and refunds, licence questions, privacy requests and accessibility feedback.`;

export const metadata: Metadata = pageMetadata({
  path: "/contact",
  title: "Contact",
  description: DESCRIPTION,
});

/**
 * `/contact`: how to write to us. One section and the footer, nothing else: the section holds the
 * page's `<h1>`, the one address of the site as a `mailto:` link and what to write to it about
 * (`ContactSection`). There is no form and no endpoint; the page sends nothing itself.
 */
export default function ContactPage() {
  return (
    <>
      <ContactSection />
      <JsonLd
        data={graph(
          ...webPage({
            path: "/contact",
            name: `Contact ${SITE.name}`,
            description: DESCRIPTION,
            type: "ContactPage",
            trail: [{ name: "Contact", path: "/contact" }],
            extra: { mainEntity: { "@id": IDS.organization } },
          }),
        )}
      />
    </>
  );
}
