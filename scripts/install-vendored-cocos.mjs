#!/usr/bin/env node
/**
 * Ensure vendor/cocos-core dependencies are installed (postinstall).
 * The trimmed runtime source lives in vendor/cocos-core — not a sidecar tarball.
 *
 * No native binaries remain: image ops use packages/portable-sharp (jimp), effect GPU
 * typecheck (former `gl`) is disabled in shdc-lib, and media duration (former ffprobe)
 * is read in JS by asset-handler/media-duration.js.
 */
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
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

function main() {
  if (!existsSync(join(coreDir, 'dist/cli.js'))) {
    console.warn(
      '[kurenai] vendor/cocos-core missing — skip deps. Maintainer: npm run vendor:cocos',
    );
    return;
  }
  if (!depsReady(coreDir)) {
    npmInstall(coreDir);
    const engine = join(coreDir, 'packages/engine');
    if (existsSync(join(engine, 'package.json'))) npmInstall(engine);
  }
  console.log(JSON.stringify({ ok: true, core: coreDir, image: 'portable-sharp/jimp' }));
}

try {
  main();
} catch (error) {
  console.error(JSON.stringify({ ok: false, error: error instanceof Error ? error.message : String(error) }));
  process.exit(1);
}
