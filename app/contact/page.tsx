import SiteShell from "@/components/SiteShell";
import { contact, contactSection } from "@/lib/content";
import {
  buildMetadata,
  contactPageSchema,
  jsonLd,
  webPageSchema,
} from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Contact — Talk to ADVANTA365",
  description:
    "Talk to our team about your Microsoft 365 adoption, governance, and enablement program. We work with large, complex, and regulated organizations worldwide.",
  path: "contact",
  keywords: [
    "contact ADVANTA365",
    "Microsoft 365 consultation",
    "enterprise Microsoft 365 consulting",
  ],
});

const contactGraph = {
  "@context": "https://schema.org",
  "@graph": [
    webPageSchema({
      path: "contact",
      name: "Contact ADVANTA365",
      description:
        "Get in touch with our team about your Microsoft 365 adoption, governance, and enablement program.",
      breadcrumb: [
        { name: "Home", path: "" },
        { name: "Contact", path: "contact" },
      ],
    }),
    contactPageSchema(),
  ],
};

const cells = [
  {
    key: "What we do",
    body: "We help large, complex organizations deploy, govern, scale, and sustain modern digital workplaces on Microsoft 365.",
  },
  {
    key: "Who we work with",
    body: "Government departments, enterprise organizations, and digital workplace transformation teams.",
  },
  {
    key: "Our focus",
    body: "SharePoint and Teams governance, user adoption and enablement, and change management.",
  },
];

export default function Contact() {
  return (
    <SiteShell>
      {/* Raw tag: keeps the structured data in the static HTML for non-JS
          crawlers (next/script would defer it into the __next_s queue). */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(contactGraph) }}
      />

      <section className="drench" style={{ paddingTop: "var(--nav-h)" }}>
        <div className="u-container pad-block-2xl">
          <p data-reveal className="t-coord">
            {contactSection.kicker}
          </p>
          <h1 data-reveal className="t-display mt-6 measure-statement">
            Get in touch.
          </h1>
          <div className="mt-10 grid gap-10 md:grid-cols-12 md:gap-16">
            <div className="md:col-span-7">
              <p data-reveal className="t-lead measure-wide">
                {contactSection.lede}
              </p>
              <div data-reveal className="mt-8 flex flex-col gap-5">
                <span className="t-coord">{contactSection.emailLabel}</span>
                <a href={`mailto:${contact.email}`} className="contact-email">
                  {contact.email}
                </a>
              </div>
            </div>
            <div className="flex flex-col md:col-span-5 md:items-end md:justify-end">
              <a
                data-reveal
                href={contact.bookingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-invert"
              >
                {contactSection.bookLabel}
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="rule-top band-2">
        <div className="u-container pad-block-xl">
          <div className="cell-grid" data-reveal-group>
            {cells.map((c, i) => (
              <article key={c.key} data-reveal className="cell">
                <span className="cell-num">
                  INF-{String(i + 1).padStart(2, "0")}
                </span>
                <h2 className="t-h3">{c.key}</h2>
                <p className="t-body text-bone-muted">{c.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
