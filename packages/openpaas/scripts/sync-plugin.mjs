#!/usr/bin/env node
/**
 * Copy the Cocos 4 openpaas builder plugin from a full PinK / cocos-cli install into plugin/sudv2.
 *
 * Ships what the builder loads at runtime (package.json, dist/, static/, i18n/) plus tools/
 * (the package sign binaries). No node_modules, sources, or source maps. The plugin requires
 * fs-extra, ejs, and jszip from the cocos-cli core it is installed into.
 *
 *   node scripts/sync-plugin.mjs [--source <cocos-cli root>]
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const sourceArg = args.indexOf("--source");
const source = resolve(
  sourceArg >= 0
    ? args[sourceArg + 1]
    : join(homedir(), "Library/Application Support/cocos-default/cocos-4.0.0-alpha.33"),
);
const out = join(repoRoot, "plugin", "sudv2");
const RUNTIME_ENTRIES = ["package.json", "dist", "static", "i18n", "tools"];

function run(cmd, cmdArgs) {
  const result = spawnSync(cmd, cmdArgs, { encoding: "utf8" });
  if (result.status !== 0) throw new Error(`${cmd} failed: ${result.stderr || result.stdout}`);
}

function main() {
  const sourceDir = join(source, "packages", "platforms", "sudv2");
  if (!existsSync(join(sourceDir, "package.json"))) throw new Error(`no OpenPaaS plugin in ${source}`);
  const engineVersion = JSON.parse(readFileSync(join(source, "packages", "engine", "package.json"), "utf8")).version;

  rmSync(out, { recursive: true, force: true });
  mkdirSync(out, { recursive: true });
  for (const rel of RUNTIME_ENTRIES) {
    const src = join(sourceDir, rel);
    if (!existsSync(src)) continue;
    const isDir = statSync(src).isDirectory();
    run("rsync", [
      "-a",
      "--exclude",
      "*.map",
      "--exclude",
      "node_modules",
      "--exclude",
      ".DS_Store",
      isDir ? `${src}/` : src,
      isDir ? `${join(out, rel)}/` : join(out, rel),
    ]);
  }

  const pkg = JSON.parse(readFileSync(join(out, "package.json"), "utf8"));
  const builder = pkg.contributes?.builder;
  if (!builder?.register) throw new Error("plugin package.json has no contributes.builder.register");
  for (const key of ["config", "hooks"]) {
    if (builder[key] && !existsSync(join(out, `${builder[key].replace(/^\.\//, "")}.js`))) {
      throw new Error(`builder.${key} (${builder[key]}) missing from plugin`);
    }
  }
  const signTool = join(out, "tools", "sud-package-sign-tool");
  if (!existsSync(signTool)) throw new Error(`sign tool missing: ${signTool}`);

  const marker = {
    id: "platform:sudv2",
    platform: builder.platform,
    pluginVersion: pkg.version,
    engineVersion,
  };
  writeFileSync(join(out, ".kurenai-pack.json"), `${JSON.stringify(marker, null, 2)}\n`);
  console.log(JSON.stringify({ ok: true, out, ...marker }, null, 2));
}

main();
