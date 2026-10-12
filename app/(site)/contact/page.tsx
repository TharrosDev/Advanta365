import type { Metadata } from "next";
import { ContactSection } from "@/components/contact/contact-section";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact",
  description: `Write to ${SITE.name} by email: questions before you buy, purchase orders and invoices, licence questions and accessibility feedback.`,
};

/**
 * `/contact`: how to write to us. One section and the footer, nothing else: the section holds the
 * page's `<h1>`, the one address of the site as a `mailto:` link and what to write to it about
 * (`ContactSection`). There is no form and no endpoint; the page sends nothing itself.
 */
export default function ContactPage() {
  return <ContactSection />;
}
