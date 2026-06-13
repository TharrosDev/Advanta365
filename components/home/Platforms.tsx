import SectionShell from "@/components/sections/SectionShell";
import SectionHeader from "@/components/sections/SectionHeader";
import CardGrid, { type GridItem } from "@/components/sections/CardGrid";
import { microsoft365Focus } from "@/lib/content";

const platformItems: GridItem[] = microsoft365Focus.map((p) => ({
  title: p.name,
  description: p.role,
  bullets: p.themes,
}));

export default function Platforms() {
  return (
    <SectionShell id="microsoft-365" className="scroll-mt-24">
      <SectionHeader
        index="06"
        label="Platform focus"
        title="Built for Microsoft 365"
        lede="Designed for SharePoint, Teams, and OneDrive — not retrofitted from a generic collaboration tool."
        className="mb-10 md:mb-12"
      />
      <CardGrid items={platformItems} variant="panel" cols={{ base: 1, md: 3 }} gap="lg" />
    </SectionShell>
  );
}
