import { defineConfig } from "vitest/config";
export default defineConfig({
  test: {
    include: ["tests/unit/**/*.test.ts", "tests/integration/**/*.test.ts"],
    testTimeout: 15000,
    hookTimeout: 30000,
    coverage: {
      provider: "v8",
      include: ["server/**/*.ts", "src/contracts/**/*.ts"],
      exclude: ["src/contracts/database.types.ts"],
      reporter: ["text", "json-summary", "html"],
      thresholds: {
        perFile: true,
        statements: 80,
        lines: 80,
        branches: 60,
        functions: 80,
      },
    },
  },
});
