import type { Metadata } from "next";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "About",
  description:
    "Thirty years of change management and user adoption practice, packaged as templates.",
};

const PRINCIPLES = [
  {
    title: "Built from real rollouts",
    body: "Every template started as a working document on a live project and was refined over many more. Nothing here is theoretical.",
  },
  {
    title: "Grounded in a proven methodology",
    body: "The collection is aligned with Prosci methodology, so each template has a clear place in a structured approach to change rather than standing alone.",
  },
  {
    title: "Made to be tailored",
    body: "You get editable files with guidance and example wording. Adapt them to your organization, your sponsor and your audience.",
  },
];

export default function AboutPage() {
  return (
    <Container className="py-10 sm:py-14">
      <div className="max-w-3xl">
        <h1 className="text-4xl font-semibold sm:text-5xl">
          Thirty years of change practice, ready to use
        </h1>
        <p className="text-muted mt-6 text-lg">
          Advanta365 is a library of the change management and user adoption materials built over a
          30-year career helping organizations adopt new technology.
        </p>
        <p className="mt-6">
          Most of that work has been with Microsoft 365, and SharePoint above all: intranets,
          migrations, collaboration and governance. The same pattern shows up every time. The
          technology is delivered on schedule, and the hard part turns out to be the people side:
          sponsorship, communication, training and reinforcement.
        </p>
        <p className="mt-4">
          These templates exist so that the people side does not have to be invented from scratch on
          each project. They serve private companies and public bodies alike, from municipal
          departments to federal agencies.
        </p>
      </div>

      <dl className="border-rule mt-14 grid gap-8 border-t pt-10 md:grid-cols-3">
        {PRINCIPLES.map((principle) => (
          <div key={principle.title}>
            <dt className="font-display text-xl font-semibold">{principle.title}</dt>
            <dd className="text-muted mt-2">{principle.body}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-14 flex flex-wrap gap-3">
        <Button href="/catalog">Browse the catalog</Button>
        <Button href="/contact" variant="secondary">
          Get in touch
        </Button>
      </div>
    </Container>
  );
}
