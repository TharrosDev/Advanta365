import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const config = [
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "playwright-report/**",
      "test-results/**",
      "next-env.d.ts",
    ],
  },
  ...nextVitals,
  ...nextTs,
  {
    // Pages and components read the catalog through lib/catalog/repository only.
    files: ["app/**", "components/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/content/*", "!@/content/taxonomy"],
              message: "Read catalog data through @/lib/catalog/repository.",
            },
          ],
        },
      ],
    },
  },
];

export default config;
