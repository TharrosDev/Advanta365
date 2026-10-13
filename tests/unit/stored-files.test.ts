import { createHash } from "node:crypto";
import { describe, expect, test } from "vitest";
import { getTemplatesWithFiles } from "@/lib/catalog/repository";
import { getFileStore } from "@/lib/files/store";

/**
 * Every file the catalog names is in the configured store, at its size and with its SHA-256. `pnpm
 * test` runs it against the fixtures (vitest.config.mts). Before launch, run it against the real
 * files: FILE_STORE=local FILE_STORE_DIR=<folder> pnpm vitest run tests/unit/stored-files.test.ts
 */
const store = getFileStore();
const templates = await getTemplatesWithFiles();
const files = templates.flatMap((template) =>
  template.files.map((file) => ({ slug: template.slug, file })),
);

describe.skipIf(store === null)("the stored files", () => {
  test("the catalog names some files", () => {
    expect(files.length).toBeGreaterThan(0);
  });

  test.each(files.map(({ slug, file }) => [`${slug}/${file.id}`, file] as const))(
    "%s is stored with its size and hash",
    async (_, file) => {
      expect(await store!.stat(file.key)).toEqual({ bytes: file.bytes });
      const stream = await store!.open(file.key);
      expect(stream).not.toBeNull();
      const bytes = new Uint8Array(await new Response(stream).arrayBuffer());
      expect(createHash("sha256").update(bytes).digest("hex")).toBe(file.sha256);
    },
  );
});
