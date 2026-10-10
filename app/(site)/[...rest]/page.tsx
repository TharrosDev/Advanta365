import { notFound } from "next/navigation";

// Sends unmatched URLs to the site 404 so it keeps the header and footer.
export default function CatchAll() {
  notFound();
}
