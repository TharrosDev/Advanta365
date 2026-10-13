import { getTemplateFile } from "@/lib/catalog/repository";
import { notFound, serveFile, tooMany, unavailable } from "@/lib/files/respond";
import { getFileStore } from "@/lib/files/store";
import { clientKey, createRateLimiter } from "@/lib/http/rate-limit";

export const runtime = "nodejs";

const limiter = createRateLimiter({ limit: 60, windowMs: 60_000 });

/**
 * `/api/samples/<slug>/<file id>`: a file of one of the six free samples, for anyone. A file of any
 * other template answers 404, exactly as a template or file that does not exist, so the address
 * tells nothing about what the toolkit holds. Licensed files are under /api/library.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string; fileId: string }> },
): Promise<Response> {
  const limited = limiter.check(clientKey(request));
  if (!limited.ok) return tooMany(limited.retryAfter);

  const store = getFileStore();
  if (!store) return unavailable();

  const { slug, fileId } = await params;
  const found = await getTemplateFile(slug, fileId);
  if (!found || !found.template.free) return notFound();

  return serveFile(store, found.file, "public");
}
