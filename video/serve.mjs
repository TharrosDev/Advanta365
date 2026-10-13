/**
 * A static server for the video pages, rooted at the repository, so a page can reach files outside
 * `video/` such as the paper grain in `public/paper/`.
 */
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const root = resolve(fileURLToPath(new URL("..", import.meta.url)));

const TYPES = {
  ".html": "text/html",
  ".mjs": "text/javascript",
  ".js": "text/javascript",
  ".webp": "image/webp",
  ".png": "image/png",
  ".jpg": "image/jpeg",
};

/** Starts the server on a free port; resolves to its base URL and a function that stops it. */
export async function serve() {
  const server = createServer(async (req, res) => {
    const file = join(root, normalize(decodeURIComponent(new URL(req.url, "http://x").pathname)));
    if (!file.startsWith(root)) return res.writeHead(403).end();
    try {
      const body = await readFile(file);
      res.writeHead(200, { "content-type": TYPES[extname(file)] ?? "application/octet-stream" });
      res.end(body);
    } catch {
      res.writeHead(404).end();
    }
  });
  await new Promise((ok) => server.listen(0, "127.0.0.1", ok));
  return {
    base: `http://127.0.0.1:${server.address().port}`,
    close: () => new Promise((ok) => server.close(ok)),
  };
}
