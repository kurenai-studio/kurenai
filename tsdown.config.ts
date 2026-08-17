import { defineConfig } from "tsdown";

const CLIENT_EXTERNALS = [
  "react",
  "react/jsx-runtime",
  "react-dom",
  "react-dom/client",
  "@deepseek-ai/cordis",
  "@deepseek-ai/dsh-client-runtime/client",
  "@deepseek-ai/dsh-client-ui-slots",
  "@deepseek-ai/dsh-client-ui-primitives",
] as const;

export default defineConfig([
  {
    name: "kurenai",
    entry: ["src/index.ts", "src/inspector-runtime/index.ts"],
    outDir: "lib",
    format: ["esm"],
    platform: "node",
    target: "es2022",
    dts: true,
    clean: true,
    fixedExtension: false,
  },
  {
    name: "kurenai/client",
    entry: { client: "src/client/index.ts" },
    outDir: "lib",
    format: ["cjs"],
    platform: "browser",
    target: "es2022",
    dts: false,
    minify: true,
    sourcemap: false,
    clean: false,
    external: [...CLIENT_EXTERNALS],
    define: {
      "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV ?? "production"),
      "import.meta.env.MODE": JSON.stringify(process.env.NODE_ENV ?? "production"),
      "import.meta.env": JSON.stringify({
        MODE: process.env.NODE_ENV ?? "production",
      }),
    },
    noExternal: (id: string) => !CLIENT_EXTERNALS.includes(id),
    outputOptions: {
      entryFileNames: "client.js",
      banner:
        'window.__ModuleLoader__.load({ id: "@kurenai-studio/dsh-plugin-kurenai", factory: (require) => {',
      footer: "return module.exports; } });",
      intro: "var module = { exports: {} }; var exports = module.exports;",
    },
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
