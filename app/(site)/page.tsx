import { BundleCard } from "@/components/catalog/bundle-card";
import { PhaseNav } from "@/components/catalog/phase-nav";
import { TemplateCard } from "@/components/catalog/template-card";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { bundleSavingsCents } from "@/lib/catalog/pricing";
import { getBundleTemplates, getBundles, getPhases, getTemplates } from "@/lib/catalog/repository";

const CREDENTIALS = [
  { figure: "30 years", label: "of change management and user adoption practice" },
  {
    figure: "SharePoint-first",
    label: "with coverage across Teams, OneDrive, Outlook and Copilot",
  },
  { figure: "Private and public", label: "sector organizations, from municipal to federal" },
  { figure: "Every step", label: "of a rollout, from first sponsor meeting to handover" },
];

function SectionHeading({
  title,
  lead,
  action,
}: {
  title: string;
  lead?: string;
  action?: { href: string; label: string };
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h2 className="text-3xl font-semibold">{title}</h2>
        {lead && <p className="text-muted mt-2 max-w-2xl">{lead}</p>}
      </div>
      {action && (
        <Button href={action.href} variant="ghost">
          {action.label}
        </Button>
      )}
    </div>
  );
}

export default async function Home() {
  const [phases, templates, bundles] = await Promise.all([
    getPhases(),
    getTemplates(),
    getBundles(),
  ]);
  const phaseNames = new Map(phases.map((phase) => [phase.slug, phase.name]));
  const featuredTemplates = templates.filter((t) => t.featured).slice(0, 6);
  const featuredBundles = await Promise.all(
    bundles
      .filter((b) => b.featured)
      .slice(0, 3)
      .map(async (bundle) => {
        const contents = await getBundleTemplates(bundle);
        return { bundle, count: contents.length, savings: bundleSavingsCents(bundle, contents) };
      }),
  );

  return (
    <>
      <section className="border-rule border-b">
        <Container className="py-16 sm:py-24">
          <p className="text-accent text-sm font-medium tracking-wide uppercase">
            SharePoint · Teams · Microsoft 365
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-semibold sm:text-6xl">
            Change management templates for Microsoft 365 rollouts
          </h1>
          <p className="text-muted mt-6 max-w-2xl text-lg">
            The plans, communications, training and measurement tools a rollout needs, drawn from 30
            years of practice and aligned with Prosci methodology. Open them, tailor them, and put
            them to work the same day.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button href="/catalog" size="lg">
              Browse the catalog
            </Button>
            <Button href="/bundles" size="lg" variant="secondary">
              See bundles
            </Button>
          </div>
        </Container>
      </section>

      <Container className="py-16 sm:py-20">
        <SectionHeading
          title="Start where your rollout is"
          lead="Templates are organized by the three phases of a rollout, so you can find what you need now and see what comes next."
        />
        <PhaseNav phases={phases} />
      </Container>

      <section className="border-rule bg-surface border-y">
        <Container className="py-16 sm:py-20">
          <SectionHeading
            title="Bundles"
            lead="Curated sets for a whole phase or a whole rollout, priced below the templates bought one at a time."
            action={{ href: "/bundles", label: "All bundles" }}
          />
          <ul className="grid gap-4 md:grid-cols-3">
            {featuredBundles.map(({ bundle, count, savings }) => (
              <li key={bundle.slug}>
                <BundleCard bundle={bundle} templateCount={count} savingsCents={savings} />
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <Container className="py-16 sm:py-20">
        <SectionHeading
          title="Featured templates"
          action={{ href: "/catalog", label: "All templates" }}
        />
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featuredTemplates.map((template) => (
            <li key={template.slug}>
              <TemplateCard template={template} phaseName={phaseNames.get(template.phase)} />
            </li>
          ))}
        </ul>
      </Container>

      <section className="border-rule bg-surface border-y">
        <Container className="py-14">
          <h2 className="sr-only">Why Advanta365</h2>
          <dl className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {CREDENTIALS.map((item) => (
              <div key={item.figure} className="border-accent border-l-2 pl-4">
                <dt className="font-display text-2xl font-semibold">{item.figure}</dt>
                <dd className="text-muted mt-1 text-sm">{item.label}</dd>
              </div>
            ))}
          </dl>
        </Container>
      </section>

      <Container className="py-16 text-center sm:py-24">
        <h2 className="mx-auto max-w-2xl text-3xl font-semibold sm:text-4xl">
          Spend your time on the people, not on the paperwork
        </h2>
        <p className="text-muted mx-auto mt-4 max-w-xl">
          Find the template for the step you are on, or take a bundle that covers the whole phase.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button href="/catalog" size="lg">
            Browse the catalog
          </Button>
          <Button href="/pricing" size="lg" variant="secondary">
            How pricing works
          </Button>
        </div>
      </Container>
    </>
  );
}
