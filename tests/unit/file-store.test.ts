import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, test } from "vitest";
import { createLocalStore } from "@/lib/files/local-store";
import { getFileStore } from "@/lib/files/store";

async function text(stream: ReadableStream<Uint8Array> | null): Promise<string | null> {
  return stream ? new Response(stream).text() : null;
}

describe("the local store", () => {
  let base: string;
  let root: string;

  beforeAll(() => {
    base = mkdtempSync(join(tmpdir(), "a365-store-"));
    root = join(base, "root");
    mkdirSync(join(root, "plan"), { recursive: true });
    writeFileSync(join(root, "plan", "deck.pptx"), "the deck");
    writeFileSync(join(base, "outside.txt"), "secret");
    symlinkSync(join(base, "outside.txt"), join(root, "plan", "link.pptx"));
  });

  afterAll(() => rmSync(base, { recursive: true, force: true }));

  test("stats and opens a file inside its root", async () => {
    const store = createLocalStore(root);
    expect(await store.stat("plan/deck.pptx")).toEqual({ bytes: 8 });
    expect(await text(await store.open("plan/deck.pptx"))).toBe("the deck");
  });

  test("answers null for a key with no file", async () => {
    const store = createLocalStore(root);
    expect(await store.stat("plan/missing.pptx")).toBeNull();
    expect(await store.open("plan/missing.pptx")).toBeNull();
  });

  test("answers null for a directory", async () => {
    const store = createLocalStore(root);
    expect(await store.stat("plan")).toBeNull();
    expect(await store.open("plan")).toBeNull();
  });

  test.each(["../outside.txt", "a/../../outside.txt", "<absolute>", ""])(
    "refuses the key %s",
    async (written) => {
      const key = written === "<absolute>" ? join(base, "outside.txt") : written;
      const store = createLocalStore(root);
      expect(await store.stat(key)).toBeNull();
      expect(await store.open(key)).toBeNull();
    },
  );

  test("refuses a symbolic link that leads out of the root", async () => {
    const store = createLocalStore(root);
    expect(await store.stat("plan/link.pptx")).toBeNull();
    expect(await store.open("plan/link.pptx")).toBeNull();
  });

  test("answers null for everything when the root does not exist", async () => {
    const store = createLocalStore(join(base, "nowhere"));
    expect(await store.stat("plan/deck.pptx")).toBeNull();
  });
});

describe("getFileStore", () => {
  test("is null when no store is configured", () => {
    expect(getFileStore({})).toBeNull();
  });

  test("is null for the local store without a folder", () => {
    expect(getFileStore({ FILE_STORE: "local" })).toBeNull();
  });

  test("is null for a store it does not know", () => {
    expect(getFileStore({ FILE_STORE: "s3", FILE_STORE_DIR: "x" })).toBeNull();
  });

  test("is the local store with a folder", () => {
    expect(getFileStore({ FILE_STORE: "local", FILE_STORE_DIR: "tests/fixtures/files" })?.id).toBe(
      "local",
    );
  });
});
