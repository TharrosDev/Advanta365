import { createReadStream } from "node:fs";
import { realpath, stat } from "node:fs/promises";
import { resolve, sep } from "node:path";
import { Readable } from "node:stream";
import type { FileStore } from "./store";

/**
 * A store that is a folder on the server's disk, for development, the tests and a self-hosted site.
 * A key is resolved inside `root` and refused if it leads anywhere else, through `..`, an absolute
 * path or a symbolic link, whatever catalog validation let through.
 */
export function createLocalStore(root: string): FileStore {
  async function locate(key: string): Promise<{ path: string; bytes: number } | null> {
    try {
      const base = await realpath(root);
      const path = await realpath(resolve(base, key));
      if (!path.startsWith(base + sep)) return null;
      const info = await stat(path);
      return info.isFile() ? { path, bytes: info.size } : null;
    } catch {
      return null;
    }
  }

  return {
    id: "local",
    async stat(key) {
      const found = await locate(key);
      return found ? { bytes: found.bytes } : null;
    },
    async open(key) {
      const found = await locate(key);
      if (!found) return null;
      return Readable.toWeb(createReadStream(found.path)) as ReadableStream<Uint8Array>;
    },
  };
}
