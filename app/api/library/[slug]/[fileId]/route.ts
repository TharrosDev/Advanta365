import { getTemplateFile } from "@/lib/catalog/repository";
import { notFound, serveFile, tooMany, unavailable } from "@/lib/files/respond";
import { getFileStore } from "@/lib/files/store";
import { clientKey, createRateLimiter } from "@/lib/http/rate-limit";
import { LICENCE_COOKIE, readCookie } from "@/lib/licence/cookie";
import { licenceEnv, verifyLicence } from "@/lib/licence/token";

export const runtime = "nodejs";

const limiter = createRateLimiter({ limit: 60, windowMs: 60_000 });

/**
 * `/api/library/<slug>/<file id>`: any file of the toolkit, for a browser holding a licence (the
 * cookie /licence sets). Without one, or with one that fails, the answer is 404, the same as for a
 * file that does not exist. The file is never cached.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string; fileId: string }> },
): Promise<Response> {
  const limited = limiter.check(clientKey(request));
  if (!limited.ok) return tooMany(limited.retryAfter);

  const token = readCookie(request.headers.get("cookie"), LICENCE_COOKIE);
  if (!verifyLicence(token, licenceEnv())) return notFound();

  const store = getFileStore();
  if (!store) return unavailable();

  const { slug, fileId } = await params;
  const found = await getTemplateFile(slug, fileId);
  if (!found) return notFound();

  return serveFile(store, found.file, "licensed");
}
