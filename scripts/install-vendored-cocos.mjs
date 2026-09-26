#!/usr/bin/env node
/**
 * Ensure vendor/cocos-core dependencies are installed (postinstall).
 * The trimmed runtime source lives in vendor/cocos-core — not a sidecar tarball.
 *
 * Native addons (gl / sharp / @ffprobe-installer) are restored from
 * vendor/cocos-core/.kurenai-prebuilts after `npm install --ignore-scripts`
 * so fresh machines never need a working node-gyp toolchain for those packages.
 *
 * Restore avoids recursive `rmSync` of large trees (some agent sandboxes block
 * bulk deletes). Prefer skip-if-present, then rename-aside + copy, then
 * best-effort cleanup of the aside dir.
 *
 * Env:
 *   KURENAI_SKIP_PREBUILT=1  — skip restore (only if webgl.node already present)
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
  return existsSync(join(dir, 'node_modules/@babel/core'));
}

function glReady(root = coreDir) {
  return existsSync(join(root, 'node_modules/gl/build/Release/webgl.node'));
}

function packageLooksRestored(name, to) {
  if (name === 'gl') return existsSync(join(to, 'build/Release/webgl.node'));
  if (name === 'sharp') {
    return existsSync(join(to, 'package.json')) && existsSync(join(to, 'build'));
  }
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
  // Single rename is one op; avoids bulk-delete guards on 100+ files.
  const aside = `${to}.kurenai-old-${process.pid}`;
  try {
    if (existsSync(aside)) {
      tryBestEffortRemove(aside);
    }
    renameSync(to, aside);
  } catch (error) {
    // If rename fails (cross-device, etc.), overwrite in place.
    console.warn(
      `[kurenai] rename-aside failed for ${to}, overwriting: ${error instanceof Error ? error.message : error}`,
    );
    cpSync(from, to, { recursive: true, force: true });
    return;
  }
  try {
    cpSync(from, to, { recursive: true });
  } catch (error) {
    // Roll back aside if copy failed.
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
    // Leave aside behind; does not block install. Some sandboxes reject bulk delete.
    console.warn(
      `[kurenai] left aside (cleanup blocked): ${path} (${error instanceof Error ? error.message : error})`,
    );
  }
}

function restorePrebuiltNatives() {
  if (process.env.KURENAI_SKIP_PREBUILT === '1') {
    if (!glReady()) {
      throw new Error(
        'KURENAI_SKIP_PREBUILT=1 but node_modules/gl/build/Release/webgl.node is missing',
      );
    }
    console.log('[kurenai] KURENAI_SKIP_PREBUILT=1 — skipped prebuilt restore');
    return;
  }

  if (!existsSync(prebuiltDir)) {
    throw new Error(
      `missing ${prebuiltDir} — vendor/cocos-core must ship .kurenai-prebuilts/{gl,sharp,@ffprobe-installer}`,
    );
  }

  for (const name of readdirSync(prebuiltDir)) {
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

  if (!glReady()) {
    throw new Error('prebuilt gl missing webgl.node after restore');
  }
}

function assertSupportedPlatform() {
  const key = `${process.platform}-${process.arch}`;
  if (key === 'darwin-arm64') return;
  console.warn(
    `[kurenai] prebuilt natives currently support darwin-arm64 only (this machine: ${key}). ` +
      'Other platforms coming later; install may fail without matching .kurenai-prebuilts.',
  );
}

function main() {
  assertSupportedPlatform();

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
  console.log(JSON.stringify({ ok: true, core: coreDir }));
}

try {
  main();
} catch (error) {
  console.error(JSON.stringify({ ok: false, error: error instanceof Error ? error.message : String(error) }));
  process.exit(1);
}
