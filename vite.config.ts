import react from "@vitejs/plugin-react";
import { execSync } from "node:child_process";
import { defineConfig } from "vitest/config";

const base = "/physical-kanban-sync/";
const version = process.env.npm_package_version ?? "0.1.0";

function git(command: string, fallback: string) {
  try {
    return execSync(command, { encoding: "utf8" }).trim();
  } catch {
    return fallback;
  }
}

const commit = git("git rev-parse --short HEAD", "local");
const buildTime = new Date().toISOString();

export default defineConfig({
  base,
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify(version),
    __APP_COMMIT__: JSON.stringify(commit),
    __APP_BUILD_TIME__: JSON.stringify(buildTime),
  },
  build: {
    outDir: "docs",
    emptyOutDir: false,
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("@mlc-ai/web-llm")) return "web-llm";
          if (id.includes("yjs") || id.includes("y-webrtc")) return "sync";
          if (id.includes("node_modules")) return "vendor";
        },
      },
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    setupFiles: ["src/test/setup.ts"],
  },
});
