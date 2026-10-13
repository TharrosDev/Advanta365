import { resolve } from "node:path";
import { createLocalStore } from "./local-store";

/**
 * Where the template files are kept. The site never reads a file except through this interface, so
 * the place can change (a folder now, an object store later) without any route changing.
 *
 * `signedUrl` is for a store that can hand out a short-lived address of its own (an S3 or R2 bucket):
 * a route then redirects there instead of streaming the file through the server. On Vercel that is
 * the only way to serve a file over 4.5 MB, the limit on a function's response.
 */
export interface FileStore {
  /** A short name for logs and tests: "local". */
  id: string;
  /** The size of the file under `key`, or `null` when there is none. */
  stat(key: string): Promise<{ bytes: number } | null>;
  /** The bytes of the file under `key`, or `null` when there is none. */
  open(key: string): Promise<ReadableStream<Uint8Array> | null>;
  /** A short-lived address that downloads the file under `downloadName`. */
  signedUrl?(key: string, downloadName: string, ttlSeconds: number): Promise<string>;
}

/**
 * The store the environment names, read on every call: `FILE_STORE=local` with `FILE_STORE_DIR` (a
 * folder, relative to the working directory or absolute). Anything else, or nothing, is `null`: no
 * store, and downloads are off.
 */
export function getFileStore(env: NodeJS.ProcessEnv = process.env): FileStore | null {
  if (env.FILE_STORE === "local" && env.FILE_STORE_DIR) {
    return createLocalStore(resolve(process.cwd(), env.FILE_STORE_DIR));
  }
  return null;
}
