import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { InkLab } from "@/components/ink/ink-lab";
import { isScene } from "@/lib/ink/stage";

export const metadata: Metadata = { title: "Ink lab", robots: { index: false, follow: false } };

type Query = { scene?: string; bare?: string; cover?: string };

/**
 * The ink lab: every scene of the ink in a mock stage. A development page, answered "not found"
 * everywhere else. `?scene=hero` shows one scene in a stage as tall as the window, `&bare=1` takes
 * the words out of it, `&cover=1` opens under the cover of a first visit.
 */
export default async function InkLabPage({ searchParams }: { searchParams: Promise<Query> }) {
  if (process.env.NODE_ENV !== "development") notFound();
  const query = await searchParams;
  return (
    <InkLab
      only={isScene(query.scene) ? query.scene : undefined}
      bare={query.bare === "1"}
      cover={query.cover === "1"}
    />
  );
}
