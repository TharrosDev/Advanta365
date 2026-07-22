import Link from "next/link";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "404 — Page not found",
  description: "The page you requested does not exist.",
  path: "404",
  noindex: true,
});

export default function NotFound() {
  return (
    <main className="draft-grid grid min-h-svh place-items-center">
      <div className="u-container py-24 text-center">
        <p className="annot">ERR-404 / Outside the framework</p>
        <h1 className="t-display mt-6">Not found.</h1>
        <p className="t-lead mx-auto mt-6 max-w-md">
          This page is not part of the governed structure. Return to the start.
        </p>
        <div className="mt-10 flex justify-center">
          <Link href="/" className="btn btn-primary">
            Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
