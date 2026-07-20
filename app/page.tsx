import SiteShell from "@/components/SiteShell";
import Hero from "@/components/sections/Hero";
import Marquee from "@/components/fx/Marquee";
import Problem from "@/components/sections/Problem";
import Framework from "@/components/sections/Framework";
import Delivery from "@/components/sections/Delivery";
import Modules from "@/components/sections/Modules";
import Platforms from "@/components/sections/Platforms";
import Adoption from "@/components/sections/Adoption";
import Why from "@/components/sections/Why";
import ContactClose from "@/components/sections/ContactClose";
import { delivery, registry } from "@/lib/content";
import {
  buildMetadata,
  itemListSchema,
  jsonLd,
  serviceSchema,
  webPageSchema,
} from "@/lib/seo";

export const metadata = buildMetadata({
  title: "ADVANTA365 — Enterprise Microsoft 365 Adoption, Governance & Rollout",
  description:
    "The enterprise Microsoft 365 framework that brings governance, adoption, and structured rollout into one operating model — for large, complex, regulated organizations.",
  path: "",
  keywords: [
    "M365 framework",
    "governance by design",
    "structured rollout",
    "role-based enablement",
    "SharePoint adoption framework",
  ],
});

const homeGraph = {
  "@context": "https://schema.org",
  "@graph": [
    webPageSchema({
      path: "",
      name: "ADVANTA365 — Enterprise Microsoft 365 Adoption, Governance & Rollout",
      description:
        "Enterprise Microsoft 365 framework bringing governance, adoption, and structured rollout into one repeatable operating model.",
    }),
    serviceSchema({
      name: "ADVANTA365 Framework",
      serviceType:
        "Microsoft 365 Adoption, Governance, Implementation and Enablement Framework",
      description:
        "An operating model that combines governance, adoption, change management, and structured rollout for SharePoint Online, Microsoft Teams, OneDrive, and the broader Microsoft 365 ecosystem.",
      path: "/",
    }),
    itemListSchema({
      name: "ADVANTA Modules",
      path: "/",
      items: registry.modules.map(m => ({
        name: `ADVANTA ${m.title}`,
        description: m.body,
      })),
    }),
    itemListSchema({
      name: "ADVANTA365 Delivery Stages",
      path: "/",
      items: delivery.stages.map(s => ({ name: s.name })),
    }),
  ],
};

export default function Home() {
  return (
    <SiteShell>
      {/* Raw tag: keeps the structured data in the static HTML for non-JS
          crawlers (next/script would defer it into the __next_s queue). */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(homeGraph) }}
      />

      <Hero />
      <Marquee />
      <Problem />
      <Framework />
      <Delivery />
      <Modules />
      <Platforms />
      <Adoption />
      <Why />
      <ContactClose />
    </SiteShell>
  );
}
