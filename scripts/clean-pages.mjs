import { rm } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(fileURLToPath(new URL("..", import.meta.url)), "docs");
const generatedPaths = [
  "assets",
  "vendor",
  "icon.svg",
  "manifest.webmanifest",
  "scanner.worker.js",
  "sw.js",
];

await Promise.all(
  generatedPaths.map((generatedPath) =>
    rm(join(root, generatedPath), { force: true, recursive: true }),
  ),
);
