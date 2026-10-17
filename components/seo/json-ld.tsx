import { serializeJsonLd, type JsonLdNode } from "@/lib/seo/structured-data";

/**
 * Structured data for search engines and AI tools: one `<script type="application/ld+json">`. The
 * browser neither runs nor draws it, so it changes nothing on the page; the content security policy
 * does not apply to it either, because it is data, not a script.
 */
export function JsonLd({ data }: { data: JsonLdNode }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  );
}
