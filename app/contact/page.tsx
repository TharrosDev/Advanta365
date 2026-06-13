import Script from "next/script";
import { ArrowUpRight } from "lucide-react";
import SiteLayout from "@/components/SiteLayout";
import PageHero from "@/components/sections/PageHero";
import MotionReveal from "@/components/MotionReveal";
import { Button } from "@/components/ui/button";
import { contact } from "@/lib/content";
import { buildMetadata, contactPageSchema, jsonLd, webPageSchema } from "@/lib/seo";

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

const audiences = [
  "Government departments",
  "Enterprise organizations",
  "Digital workplace transformation teams",
];

const focus = ["SharePoint & Teams governance", "User adoption & enablement", "Change management"];

export default function Contact() {
  return (
    <SiteLayout>
      <Script
        id="ld-contact"
        type="application/ld+json"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{ __html: jsonLd(contactGraph) }}
      />
      <PageHero
        label="Talk to us"
        title="Get in touch"
        lede="Ready to transform your Microsoft 365 program? Let's talk about your organization's adoption, governance, and enablement needs."
      />

      <section className="section-y bg-background">
        <div className="container">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-16">
            {/* Contact actions */}
            <MotionReveal from="up" className="lg:col-span-7">
              <div className="draft-panel bg-paper-panel p-6 md:p-8 wide:p-10">
                <div className="mb-7 flex items-center gap-4 border-b border-rule pb-4">
                  <span className="figure-index text-sm">A365</span>
                  <span className="mono-label">Start a conversation</span>
                </div>

                <p className="mono-label">Email us</p>
                <a
                  href={`mailto:${contact.email}`}
                  className="mt-2 block break-words font-display text-[clamp(1.5rem,1rem+2.6vw,2.75rem)] font-bold leading-tight tracking-tight text-ink transition-colors hover:text-primary"
                >
                  {contact.email}
                </a>

                <p className="body-base mt-6 max-w-prose text-ink-2">
                  Tell us where your Microsoft 365 program is today and where you want it to be. We
                  read and reply to every message.
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Button asChild size="lg" className="gap-2">
                    <a href={`mailto:${contact.email}`}>
                      Email us
                      <ArrowUpRight className="h-4 w-4" />
                    </a>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="gap-2">
                    <a href={contact.bookingUrl} target="_blank" rel="noopener noreferrer">
                      Book a call
                      <ArrowUpRight className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </div>
            </MotionReveal>

            {/* Info */}
            <div className="space-y-px lg:col-span-5">
              <MotionReveal from="up" delay={80} className="border-t-2 border-ink bg-background p-6 md:p-7">
                <span className="mono-label">What we do</span>
                <h3 className="h-card mt-3 text-ink">Enterprise Microsoft 365 framework</h3>
                <p className="body-base mt-2 text-ink-2">
                  We help large, complex organizations deploy, govern, scale, and sustain modern
                  digital workplaces on Microsoft 365.
                </p>
              </MotionReveal>

              <MotionReveal from="up" delay={140} className="border-t border-rule-strong bg-background p-6 md:p-7">
                <span className="mono-label">Who we work with</span>
                <ul className="mt-4 space-y-2.5">
                  {audiences.map((a) => (
                    <li key={a} className="body-base flex items-start gap-3 text-ink">
                      <span aria-hidden className="mt-[0.7em] h-px w-3 flex-shrink-0 bg-primary" />
                      <span>{a}</span>
                    </li>
                  ))}
                </ul>
              </MotionReveal>

              <MotionReveal from="up" delay={200} className="border-t border-rule-strong bg-background p-6 md:p-7">
                <span className="mono-label">Our focus</span>
                <ul className="mt-4 space-y-2.5">
                  {focus.map((f) => (
                    <li key={f} className="body-base flex items-start gap-3 text-ink">
                      <span aria-hidden className="mt-[0.7em] h-px w-3 flex-shrink-0 bg-primary" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </MotionReveal>
            </div>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
