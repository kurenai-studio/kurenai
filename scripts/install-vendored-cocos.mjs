#!/usr/bin/env node
/**
 * Ensure vendor/cocos-core dependencies are installed (postinstall).
 * The trimmed runtime source lives in vendor/cocos-core — not a sidecar tarball.
 *
 * Native addons (gl / sharp / @ffprobe-installer) are restored from
 * vendor/cocos-core/.kurenai-prebuilts after `npm install --ignore-scripts`
 * so fresh machines never need a working node-gyp toolchain for those packages.
 */
import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
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
    [
      'install',
      '--omit=dev',
      '--no-audit',
      '--no-fund',
      '--ignore-scripts',
    ],
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

function restorePrebuiltNatives() {
  if (!existsSync(prebuiltDir)) {
    throw new Error(
      `missing ${prebuiltDir} — vendor/cocos-core must ship .kurenai-prebuilts/{gl,sharp,@ffprobe-installer}`,
    );
  }
  for (const name of readdirSync(prebuiltDir)) {
    const from = join(prebuiltDir, name);
    const to = join(coreDir, 'node_modules', name);
    rmSync(to, { recursive: true, force: true });
    mkdirSync(dirname(to), { recursive: true });
    cpSync(from, to, { recursive: true });
    console.log(`[kurenai] restored prebuilt node_modules/${name}`);
  }
  if (!existsSync(join(coreDir, 'node_modules/gl/build/Release/webgl.node'))) {
    throw new Error('prebuilt gl missing webgl.node after restore');
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
  console.log(JSON.stringify({ ok: true, core: coreDir }));
}

try {
  main();
} catch (error) {
  console.error(JSON.stringify({ ok: false, error: error instanceof Error ? error.message : String(error) }));
  process.exit(1);
}
