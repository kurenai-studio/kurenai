#!/usr/bin/env node
/**
 * Ensure vendor/cocos-core dependencies are installed (postinstall).
 * The trimmed runtime source lives in vendor/cocos-core — not a sidecar tarball.
 *
 * Remaining native stash: @ffprobe-installer binaries, restored from
 * vendor/cocos-core/.kurenai-prebuilts after `npm install --ignore-scripts`.
 * Image ops use packages/portable-sharp (jimp, pure JS). Effect GPU typecheck
 * (former `gl`) is disabled in shdc-lib.
 *
 * Restore avoids recursive `rmSync` of large trees (some agent sandboxes block
 * bulk deletes). Prefer skip-if-present, then rename-aside + copy, then
 * best-effort cleanup of the aside dir.
 *
 * Env:
 *   KURENAI_SKIP_PREBUILT=1  — skip restore
 */
import { spawnSync } from 'node:child_process';
import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  renameSync,
  rmSync,
  statSync,
} from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '..');
const coreDir = join(repoRoot, 'vendor', 'cocos-core');
const prebuiltDir = join(coreDir, '.kurenai-prebuilts');

function npmInstall(dir) {
  console.log(`[kurenai] npm install --omit=dev --ignore-scripts in ${dir}`);
  const result = spawnSync(
    'npm',
    ['install', '--omit=dev', '--no-audit', '--no-fund', '--ignore-scripts'],
    {
      cwd: dir,
      stdio: 'inherit',
      env: { ...process.env, npm_config_progress: 'false' },
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

function packageLooksRestored(name, to) {
  if (name === '@ffprobe-installer' || name.startsWith('@')) {
    return existsSync(join(to, 'package.json'));
  }
  return existsSync(join(to, 'package.json'));
}

/** Replace dest with src without recursive rm of dest (sandbox-friendly). */
function replaceTree(from, to) {
  mkdirSync(dirname(to), { recursive: true });
  if (!existsSync(to)) {
    cpSync(from, to, { recursive: true });
    return;
  }
  const aside = `${to}.kurenai-old-${process.pid}`;
  try {
    if (existsSync(aside)) {
      tryBestEffortRemove(aside);
    }
    renameSync(to, aside);
  } catch (error) {
    console.warn(
      `[kurenai] rename-aside failed for ${to}, overwriting: ${error instanceof Error ? error.message : error}`,
    );
    cpSync(from, to, { recursive: true, force: true });
    return;
  }
  try {
    cpSync(from, to, { recursive: true });
  } catch (error) {
    try {
      if (!existsSync(to)) renameSync(aside, to);
    } catch {
      /* ignore */
    }
    throw error;
  }
  tryBestEffortRemove(aside);
}

function tryBestEffortRemove(path) {
  try {
    rmSync(path, { recursive: true, force: true, maxRetries: 2 });
  } catch (error) {
    console.warn(
      `[kurenai] left aside (cleanup blocked): ${path} (${error instanceof Error ? error.message : error})`,
    );
  }
}

function restorePrebuiltNatives() {
  if (process.env.KURENAI_SKIP_PREBUILT === '1') {
    console.log('[kurenai] KURENAI_SKIP_PREBUILT=1 — skipped prebuilt restore');
    return;
  }

  if (!existsSync(prebuiltDir)) {
    console.warn(
      `[kurenai] no ${prebuiltDir} — skipping prebuilt restore (ffprobe may be missing)`,
    );
    return;
  }

  for (const name of readdirSync(prebuiltDir)) {
    // Legacy stashes; image/GPU natives are no longer required.
    if (name === 'gl' || name === 'sharp' || name.startsWith('gl.') || name.startsWith('sharp.')) {
      console.log(`[kurenai] ignore legacy prebuilt ${name}`);
      continue;
    }
    const from = join(prebuiltDir, name);
    if (!statSync(from).isDirectory()) continue;
    const to = join(coreDir, 'node_modules', name);
    if (packageLooksRestored(name, to)) {
      console.log(`[kurenai] prebuilt node_modules/${name} already present — skip`);
      continue;
    }
    replaceTree(from, to);
    console.log(`[kurenai] restored prebuilt node_modules/${name}`);
  }
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
  restorePrebuiltNatives();
  console.log(JSON.stringify({ ok: true, core: coreDir, image: 'portable-sharp/jimp' }));
}

try {
  main();
} catch (error) {
  console.error(JSON.stringify({ ok: false, error: error instanceof Error ? error.message : String(error) }));
  process.exit(1);
}
