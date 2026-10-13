import type { TemplateFile } from "@/lib/catalog/schema";
import type { FileStore } from "./store";
import { FILE_TYPES, extensionOf } from "./types";

/** How long a signed address from the store stays good, in seconds. */
const SIGNED_URL_TTL = 300;

const PLAIN = {
  "Content-Type": "text/plain; charset=utf-8",
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
  "X-Robots-Tag": "noindex",
};

/** The one answer for a file that is not there to be had: locked, unknown or missing alike. */
export function notFound(): Response {
  return new Response("Not found.", { status: 404, headers: PLAIN });
}

export function tooMany(retryAfter: number): Response {
  return new Response("Too many requests. Try again shortly.", {
    status: 429,
    headers: { ...PLAIN, "Retry-After": String(retryAfter) },
  });
}

/** No file store is configured: downloads are off. */
export function unavailable(): Response {
  return new Response("Downloads are not available right now.", { status: 503, headers: PLAIN });
}

/**
 * A `Content-Disposition` that saves the file under its name: a plain `filename` for old clients
 * (anything outside printable ASCII, and `"` and `\`, become `_`) and an RFC 5987 `filename*`.
 */
export function contentDisposition(name: string): string {
  const plain = name.replace(/[^\x20-\x7e]|["\\]/g, "_");
  const encoded = encodeURIComponent(name).replace(
    /['()*]/g,
    (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`,
  );
  return `attachment; filename="${plain}"; filename*=UTF-8''${encoded}`;
}

/**
 * The response that downloads one file: a redirect to the store's signed address when it has one,
 * else the bytes streamed through. A free sample may be cached for an hour; a licensed file never.
 * A file the store does not have is a 404, the same as any file that is not to be had.
 */
export async function serveFile(
  store: FileStore,
  file: TemplateFile,
  access: "public" | "licensed",
): Promise<Response> {
  if (store.signedUrl) {
    const location = await store.signedUrl(file.key, file.name, SIGNED_URL_TTL);
    return new Response(null, {
      status: 302,
      headers: { Location: location, "Cache-Control": "no-store", "X-Robots-Tag": "noindex" },
    });
  }

  const found = await store.stat(file.key);
  const body = found ? await store.open(file.key) : null;
  if (!found || !body) return notFound();

  const extension = extensionOf(file.name);
  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": extension ? FILE_TYPES[extension] : "application/octet-stream",
      "Content-Length": String(found.bytes),
      "Content-Disposition": contentDisposition(file.name),
      "Cache-Control": access === "public" ? "public, max-age=3600" : "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "X-Robots-Tag": "noindex",
    },
  });
}
