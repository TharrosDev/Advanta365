/**
 * A static server for the video pages, rooted at the repository. A request for a TypeScript module
 * (with or without its `.ts`) is answered with the module's types stripped, so a page can import
 * the ink engine straight from `lib/ink/` with no bundler.
 */
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { stripTypeScriptTypes } from "node:module";

export const root = resolve(fileURLToPath(new URL("..", import.meta.url)));

const TYPES = {
  ".html": "text/html",
  ".mjs": "text/javascript",
  ".js": "text/javascript",
  ".ts": "text/javascript",
  ".webp": "image/webp",
  ".png": "image/png",
  ".jpg": "image/jpeg",
};

async function isFile(path) {
  try {
    return (await stat(path)).isFile();
  } catch {
    return false;
  }
}

/** Starts the server on a free port; resolves to its base URL and a function that stops it. */
export async function serve() {
  const server = createServer(async (req, res) => {
    let file = join(root, normalize(decodeURIComponent(new URL(req.url, "http://x").pathname)));
    if (!file.startsWith(root)) return res.writeHead(403).end();
    if (!extname(file) && (await isFile(`${file}.ts`))) file = `${file}.ts`;
    try {
      let body = await readFile(file);
      if (extname(file) === ".ts") body = stripTypeScriptTypes(body.toString("utf8"));
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
