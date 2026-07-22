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

      <section className="signoff" style={{ paddingTop: "var(--nav-h)" }}>
        <div className="u-container pad-block-2xl">
          <div className="stamp-frame" data-reveal>
            <span className="stamp-badge" aria-hidden="true">
              365
            </span>
            <span className="annot">{contactSection.kicker}</span>
            <h1 className="t-display mt-6 measure-statement">Get in touch.</h1>
            <div className="mt-10 grid gap-10 md:grid-cols-12 md:gap-16">
              <div className="md:col-span-7">
                <p className="t-lead measure-wide">{contactSection.lede}</p>
                <div className="mt-8 flex flex-col gap-4">
                  <span className="annot">{contactSection.emailLabel}</span>
                  <a href={`mailto:${contact.email}`} className="contact-email">
                    {contact.email}
                  </a>
                </div>
              </div>
              <div className="flex flex-col md:col-span-5 md:items-end md:justify-end">
                <a
                  href={contact.bookingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary !px-7 !py-4"
                >
                  {contactSection.bookLabel}
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="rule-top band-2">
        <div className="u-container pad-block-xl">
          <div
            className="grid gap-4 md:grid-cols-3"
            data-reveal-group
          >
            {cells.map((c, i) => (
              <article key={c.key} data-reveal className="node">
                <span className="node-code">
                  INF-{String(i + 1).padStart(2, "0")}
                </span>
                <h2 className="node-title">{c.key}</h2>
                <p className="node-body">{c.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
