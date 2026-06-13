import Script from "next/script";
import SiteLayout from "@/components/SiteLayout";
import Hero from "@/components/home/Hero";
import ProofStrip from "@/components/home/ProofStrip";
import WhatIs from "@/components/home/WhatIs";
import DeliveryScroll from "@/components/home/DeliveryScroll";
import ModuleShowcase from "@/components/home/ModuleShowcase";
import Governance from "@/components/home/Governance";
import Adoption from "@/components/home/Adoption";
import Platforms from "@/components/home/Platforms";
import Why from "@/components/home/Why";
import CTABand from "@/components/sections/CTABand";
import { contact, contactCTA, deliveryStages, modules } from "@/lib/content";
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
      items: modules.map((m) => ({ name: `ADVANTA ${m.title}`, description: m.description })),
    }),
    itemListSchema({
      name: "ADVANTA365 Delivery Stages",
      path: "/",
      items: deliveryStages.map((s) => ({ name: s.label })),
    }),
  ],
};

export default function Home() {
  return (
    <SiteLayout>
      <Script
        id="ld-home"
        type="application/ld+json"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{ __html: jsonLd(homeGraph) }}
      />

      <Hero />
      <ProofStrip />
      <WhatIs />
      <DeliveryScroll />
      <ModuleShowcase />
      <Governance />
      <Adoption />
      <Platforms />
      <Why />

      <CTABand
        label="Get started"
        title={contactCTA.title}
        lede={contactCTA.description}
        primary={{ label: "Book a call", href: "/contact" }}
        secondary={{ label: "Email us", href: `mailto:${contact.email}` }}
        tone="dark"
      />
    </SiteLayout>
  );
}
