import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/unit/**/*.test.ts"],
    // The fixture file store and a licence secret for tests only, never a real one.
    env: {
      FILE_STORE: "local",
      FILE_STORE_DIR: "tests/fixtures/files",
      LICENCE_SECRET: "test-secret-test-secret-test-secret-0",
    },
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL(".", import.meta.url)),
    },
  },
});
