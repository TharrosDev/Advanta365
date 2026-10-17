/**
 * A Markdown file for AI tools, served as plain UTF-8 text (the llms.txt proposal asks for
 * Markdown at a `.txt` address). It may be cached for an hour and is built with the site.
 */
export function textResponse(body: string): Response {
  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
}
