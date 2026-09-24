import { defineConfig } from "tsdown";

export default defineConfig([
  {
    name: "kurenai",
    entry: ["src/index.ts", "src/inspector-runtime/index.ts", "src/cli/parse.ts"],
    outDir: "lib",
    format: ["esm"],
    platform: "node",
    target: "es2022",
    dts: true,
    clean: true,
    fixedExtension: false,
  },
  {
    name: "kurenai/inspector-browser",
    entry: { inspector: "src/inspector-runtime/auto.ts" },
    outDir: "lib",
    format: ["iife"],
    platform: "browser",
    target: "es2022",
    dts: false,
    minify: true,
    sourcemap: false,
    clean: false,
    outputOptions: {
      entryFileNames: "inspector.js",
    },
  },
]);
