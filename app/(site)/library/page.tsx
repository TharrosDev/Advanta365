import type { Metadata } from "next";
import { cookies } from "next/headers";
import { LibrarySection } from "@/components/library/library-section";
import { getPhases, getTemplatesWithFiles } from "@/lib/catalog/repository";
import { getFileStore } from "@/lib/files/store";
import { LICENCE_COOKIE } from "@/lib/licence/cookie";
import { licenceEnv, verifyLicence } from "@/lib/licence/token";

export const metadata: Metadata = {
  title: "Your toolkit",
  description: "The files of the toolkit, for a browser that holds a licence.",
  robots: { index: false, follow: false },
};

/**
 * `/library`: every file of the toolkit, for a browser holding a licence (the cookie that /licence
 * sets). Without one it says how to get one; after a link that failed (`link=invalid`) it says that
 * first. It reads the cookie, so it renders on every request, and it is not in the navigation.
 */
export default async function LibraryPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [jar, query, phases, templates] = await Promise.all([
    cookies(),
    searchParams,
    getPhases(),
    getTemplatesWithFiles(),
  ]);
  const licensed = verifyLicence(jar.get(LICENCE_COOKIE)?.value, licenceEnv()) !== null;

  return (
    <LibrarySection
      state={!licensed ? "locked" : getFileStore() ? "open" : "unavailable"}
      linkFailed={query.link === "invalid"}
      phases={phases}
      templates={templates}
    />
  );
}
