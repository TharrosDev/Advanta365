import type { Metadata } from "next";
import { Container } from "@/components/layout/container";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact",
  description: "Questions about the templates, licensing or purchasing for your organization.",
};

export default function ContactPage() {
  return (
    <Container className="py-10 sm:py-14">
      <div className="max-w-2xl">
        <h1 className="text-4xl font-semibold">Contact</h1>
        <p className="mt-4 text-lg text-muted">
          Questions about a template, licensing for your organization, or buying by purchase order?
          Send an email and you will get a reply from a person.
        </p>
        <p className="mt-8">
          <a
            href={`mailto:${SITE.contactEmail}`}
            className="font-display text-2xl font-semibold break-all text-accent underline underline-offset-4"
          >
            {SITE.contactEmail}
          </a>
        </p>
      </div>
    </Container>
  );
}
