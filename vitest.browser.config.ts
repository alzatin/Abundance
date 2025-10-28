import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    exclude: ["tests/patchDependencies.mjs", "tests/setupVitestMocks.mjs"],
    browser: {
      enabled: true,
      //headless: true,
      provider: "playwright",
      // https://vitest.dev/guide/browser/playwright
      instances: [{ browser: "chromium" }],
    },
  },
});
