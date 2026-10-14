import { defineConfig } from "vitest/config";
export default defineConfig({ test: { environment: "node", include: ["tests/**/*.test.js"],
  coverage: { provider: "istanbul", include: ["app.js", "image-markup.js"], reporter: ["text", "json", "json-summary", "html"],
    thresholds: { lines: 100, branches: 100, functions: 100, statements: 100 } } } });
