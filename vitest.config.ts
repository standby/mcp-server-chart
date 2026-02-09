import { coverageConfigDefaults, defineConfig } from "vitest/config";

const enableCoverage = process.argv.includes("--coverage");

export default defineConfig({
  resolve: {},
  test: {
    testTimeout: 60_000,
    hookTimeout: 60_000,
    include: ["__tests__/**/*.{test,spec}.?(c|m)[jt]s?(x)"],
    setupFiles: ["__tests__/setup.ts"],
    server: {
      deps: {
        inline: ["@antv/gpt-vis-ssr"],
      },
    },
    ...(enableCoverage
      ? {
          coverage: {
            exclude: ["**/build/**", ...coverageConfigDefaults.exclude],
          },
        }
      : {}),
  },
});
