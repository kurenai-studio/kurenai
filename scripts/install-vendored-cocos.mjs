#!/usr/bin/env node
/**
 * Ensure vendor/cocos-core dependencies are installed (postinstall).
 * The trimmed runtime source lives in vendor/cocos-core — not a sidecar tarball.
 *
 * No native binaries remain: image ops use packages/portable-sharp (jimp), effect GPU
 * typecheck (former `gl`) is disabled in shdc-lib, and media duration (former ffprobe)
 * is read in JS by asset-handler/media-duration.js.
 *
 * packages/engine/node_modules is not installed: preview runs on the prebuilt engine
 * bundles, and publish gets the few engine-local packages it needs from the `build` pack.
 */
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, linkSync, lstatSync, readdirSync, readFileSync, renameSync, unlinkSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '..');
const coreDir = join(repoRoot, 'vendor', 'cocos-core');

function npmInstall(dir) {
  console.log(`[kurenai] npm install --omit=dev --ignore-scripts in ${dir}`);
  const result = spawnSync(
    'npm',
    ['install', '--omit=dev', '--no-audit', '--no-fund', '--ignore-scripts'],
    {
      cwd: dir,
      stdio: 'inherit',
      env: { ...process.env, npm_config_progress: 'false' },
      // npm is npm.cmd on Windows, which Node only runs through a shell.
      shell: process.platform === 'win32',
    },
  );
  if (result.status !== 0) throw new Error(`npm install failed in ${dir}`);
}

function depsReady(dir) {
  return (
    existsSync(join(dir, 'node_modules/@babel/core')) &&
    existsSync(join(dir, 'node_modules/sharp/package.json')) &&
    existsSync(join(dir, 'node_modules/jimp/package.json'))
  );
}

/**
 * Hard-link byte-identical files. npm nests the same TypeScript 4.9.5 under both
 * @cocos/ccbuild and @cocos/tfig (the root needs 5.9.3), which alone is ~65 MB.
 */
function hardlinkDuplicates(dir, minBytes = 4096) {
  const bySize = new Map();
  const walk = (current) => {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const full = join(current, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.isFile()) {
        const { size } = lstatSync(full);
        if (size < minBytes) continue;
        const group = bySize.get(size);
        if (group) group.push(full);
        else bySize.set(size, [full]);
      }
    }
  };
  walk(dir);

  let linked = 0;
  let savedBytes = 0;
  for (const [size, files] of bySize) {
    if (files.length < 2) continue;
    const firstByHash = new Map();
    for (const file of files) {
      const hash = createHash('sha1').update(readFileSync(file)).digest('hex');
      const first = firstByHash.get(hash);
      if (!first) {
        firstByHash.set(hash, file);
        continue;
      }
      if (lstatSync(first).ino === lstatSync(file).ino) continue;
      const aside = `${file}.kurenai-dedupe`;
      try {
        renameSync(file, aside);
        linkSync(first, file);
        unlinkSync(aside);
        linked += 1;
        savedBytes += size;
      } catch {
        if (!existsSync(file) && existsSync(aside)) renameSync(aside, file);
      }
    }
  }
  return { linked, savedMB: Math.round(savedBytes / 1e5) / 10 };
}

function main() {
  if (!existsSync(join(coreDir, 'dist/core/launcher.js'))) {
    console.warn(
      '[kurenai] vendor/cocos-core missing — skip deps. Maintainer: npm run vendor:slim',
    );
    return;
  }
  let dedupe;
  if (!depsReady(coreDir)) {
    npmInstall(coreDir);
    dedupe = hardlinkDuplicates(join(coreDir, 'node_modules'));
  }
  console.log(JSON.stringify({ ok: true, core: coreDir, image: 'portable-sharp/jimp', dedupe }));
}

try {
  main();
} catch (error) {
  console.error(JSON.stringify({ ok: false, error: error instanceof Error ? error.message : String(error) }));
  process.exit(1);
}
