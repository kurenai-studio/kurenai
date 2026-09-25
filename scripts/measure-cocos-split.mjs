#!/usr/bin/env node
/**
 * Measure proposed cocos-cli split sizes against a local install.
 *
 * Usage:
 *   node scripts/measure-cocos-split.mjs
 *   KURENAI_COCOS_CLI_ROOT=/path/to/cocos-cli node scripts/measure-cocos-split.mjs
 *
 * Reads docs/cocos-cli-split.manifest.json for path sets; prints JSON to stdout.
 */
import { readFileSync, existsSync, statSync, readdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { homedir } from 'node:os';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..');
const manifestPath = join(repoRoot, 'docs/cocos-cli-split.manifest.json');

const DEFAULT_ROOT = join(
  homedir(),
  'Library/Application Support/cocos-default/cocos-4.0.0-alpha.33',
);

function du(path) {
  if (!existsSync(path)) return 0;
  const st = statSync(path);
  if (st.isFile()) return st.size;
  let total = 0;
  for (const name of readdirSync(path)) {
    if (name === '.DS_Store') continue;
    total += du(join(path, name));
  }
  return total;
}

function mb(bytes) {
  return Math.round((bytes / 1024 / 1024) * 10) / 10;
}

function main() {
  const root = resolve(process.env.KURENAI_COCOS_CLI_ROOT || DEFAULT_ROOT);
  if (!existsSync(root)) {
    console.error(JSON.stringify({ ok: false, error: `cocos-cli root not found: ${root}` }));
    process.exit(2);
  }

  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  const core = manifest.packs.core;

  // Core: sum includes, but for packages/engine/** apply excludes explicitly.
  let coreBytes = 0;
  const coreParts = {};
  for (const g of core.include) {
    const rel = g.replace(/\/\*\*$/, '');
    if (rel === 'packages/engine') {
      // everything under engine except excluded subtrees
      const engineRoot = join(root, 'packages/engine');
      let size = du(engineRoot);
      for (const eg of core.exclude) {
        const er = eg.replace(/\/\*\*$/, '');
        if (er.startsWith('packages/engine/')) size -= du(join(root, er));
      }
      coreParts['packages/engine (minus native/tests/docs)'] = Math.max(0, size);
      coreBytes += Math.max(0, size);
      continue;
    }
    if (rel.startsWith('packages/engine/')) continue; // covered above if using /** ; manifest lists engine/**
    const size = du(join(root, rel));
    coreParts[rel] = size;
    coreBytes += size;
  }

  // Fix: manifest include has packages/engine/** only once — also listed finer? Check include list.
  // Our manifest has "packages/engine/**" as single entry — good.

  const platforms = {};
  for (const p of manifest.packs.platform.packs) {
    platforms[p.id] = mb(du(join(root, p.dir)));
  }

  const nativeTargets = {};
  for (const t of manifest.packs.native.targets) {
    nativeTargets[t.id] = mb(t.paths.reduce((s, p) => s + du(join(root, p)), 0));
  }
  const nativeShared = {};
  for (const t of manifest.packs.native.shared) {
    nativeShared[t.id] = mb(t.paths.reduce((s, p) => s + du(join(root, p)), 0));
  }
  const platformTools = {};
  for (const t of manifest.packs.platformTools.packs) {
    platformTools[t.id] = mb(t.paths.reduce((s, p) => s + du(join(root, p)), 0));
  }

  const full = du(root);
  const out = {
    ok: true,
    root,
    fullMB: mb(full),
    coreMB: mb(coreBytes),
    savingsMB: mb(full - coreBytes),
    corePartsMB: Object.fromEntries(Object.entries(coreParts).map(([k, v]) => [k, mb(v)])),
    platformsMB: platforms,
    nativeSharedMB: nativeShared,
    nativeTargetsMB: nativeTargets,
    platformToolsMB: platformTools,
    trimCandidatesMB: Object.fromEntries(
      (core.trimCandidates || []).map((p) => [p, mb(du(join(root, p)))]),
    ),
  };
  process.stdout.write(`${JSON.stringify(out, null, 2)}\n`);
}

main();
