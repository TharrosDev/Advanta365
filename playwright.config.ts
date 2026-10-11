import { spawnSync } from "node:child_process";
import { defineConfig, devices, firefox } from "@playwright/test";

// Port 3100 keeps the test server clear of a dev server on 3000.
const PORT = 3100;

// The ink runs on the graphics card or not at all: headless Chromium gets a GPU only with these
// arguments, and on Windows the Direct3D backend.
const GPU_ARGS = [
  "--ignore-gpu-blocklist",
  "--enable-gpu",
  ...(process.platform === "win32" ? ["--use-angle=d3d11"] : []),
];

/**
 * Whether the installed Firefox starts. It is the browser that really lacks view timelines, so it
 * exercises the observer path of the motion system. A copy that cannot start (a broken runtime on
 * the machine, a missing install) must not fail the whole run: the project is left out and the same
 * path is covered in Chromium with `CSS.supports` stubbed (motion.spec.ts). Set `PW_FIREFOX=1` to
 * require it anyway.
 */
function firefoxStarts(): boolean {
  if (process.env.PW_FIREFOX === "1") return true;
  try {
    const result = spawnSync(firefox.executablePath(), ["--version"], { timeout: 15_000 });
    return result.status === 0;
  } catch {
    return false;
  }
}

const withFirefox = firefoxStarts();
if (!withFirefox) {
  console.warn("[playwright] Firefox does not start here: the firefox project is not run.");
}

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  reporter: "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      testIgnore: /ink-live\.spec\.ts/,
      use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 800 } },
    },
    { name: "mobile", testIgnore: /ink-live\.spec\.ts/, use: { ...devices["Pixel 7"] } },
    // The live ink: one worker and one test at a time, after everything else has finished, so
    // that the frame costs and the clocks it reads are not those of a busy machine.
    {
      name: "gpu",
      testMatch: /ink-live\.spec\.ts/,
      fullyParallel: false,
      dependencies: ["chromium", "mobile", ...(withFirefox ? ["firefox"] : [])],
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 900 },
        launchOptions: { args: GPU_ARGS },
      },
    },
    ...(withFirefox
      ? [
          {
            name: "firefox",
            testMatch: /(browse|console|reduced-motion|ink-fallback|motion)\.spec\.ts/,
            use: { ...devices["Desktop Firefox"], viewport: { width: 1280, height: 800 } },
          },
        ]
      : []),
  ],
  webServer: {
    // npm run works whichever package manager is on PATH.
    command: `npm run build && npm run start -- -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
