'use strict';

/**
 * Version-pinned headless runtime (engine + mini-packer), not a Creator install.
 *
 * Layout:
 *   runtime/3.8.8/
 *     manifest.json
 *     engine/           preview + native-external + internal-library
 *     node_modules/     traced @cocos/creator-programming-*
 *     utils/dist/uuid.js
 */

const fs = require('fs');
const path = require('path');

const ENGINE_VERSION = '3.8.8';

function repoRootFrom(here) {
  return path.resolve(here, '..');
}

function kitDir(repoRoot) {
  return path.join(repoRoot, 'runtime', ENGINE_VERSION);
}

function engineLooksReady(dir) {
  return Boolean(dir && fs.existsSync(path.join(dir, 'preview')));
}

function npmLooksReady(dir) {
  return Boolean(
    dir &&
      fs.existsSync(path.join(dir, '@cocos/creator-programming-quick-pack/lib/quick-pack.js')),
  );
}

function resolveEngineSnapshot(opts = {}) {
  const env = opts.env || process.env;
  const repoRoot = opts.repoRoot || repoRootFrom(__dirname);
  if (env.ENGINE_SNAPSHOT && engineLooksReady(env.ENGINE_SNAPSHOT)) {
    return path.resolve(env.ENGINE_SNAPSHOT);
  }
  const candidates = [
    path.join(kitDir(repoRoot), 'engine'),
    path.join(repoRoot, 'templates/runtime/engine-snapshot'),
    path.join(repoRoot, 'docker/build-context/engine'),
    path.join(repoRoot, 'spike/engine-snapshot'),
  ];
  for (const dir of candidates) {
    if (engineLooksReady(dir)) return path.resolve(dir);
  }
  return '';
}

function resolveNpmRoot(opts = {}) {
  const env = opts.env || process.env;
  const repoRoot = opts.repoRoot || repoRootFrom(__dirname);
  if (env.NPM_ROOT && npmLooksReady(env.NPM_ROOT)) {
    return path.resolve(env.NPM_ROOT);
  }
  const candidates = [
    path.join(kitDir(repoRoot), 'node_modules'),
    path.join(repoRoot, 'docker/build-context/vendor/node_modules'),
    path.join(repoRoot, 'tmp-asar-root/node_modules'),
    path.join(repoRoot, 'node_modules'),
  ];
  for (const dir of candidates) {
    if (npmLooksReady(dir)) return path.resolve(dir);
  }
  return '';
}

function resolveUuidUtil(opts = {}) {
  const env = opts.env || process.env;
  const repoRoot = opts.repoRoot || repoRootFrom(__dirname);
  const npm = resolveNpmRoot({ env, repoRoot });
  if (env.UUID_UTIL && fs.existsSync(env.UUID_UTIL)) return path.resolve(env.UUID_UTIL);
  const candidates = [
    path.join(kitDir(repoRoot), 'utils/dist/uuid.js'),
    path.join(repoRoot, 'docker/build-context/vendor/utils/dist/uuid.js'),
    npm ? path.join(npm, '../utils/dist/uuid.js') : '',
  ].filter(Boolean);
  for (const file of candidates) {
    if (fs.existsSync(file)) return path.resolve(file);
  }
  return '';
}

function kitStatus(opts = {}) {
  const repoRoot = opts.repoRoot || repoRootFrom(__dirname);
  const env = opts.env || process.env;
  const engine = resolveEngineSnapshot({ env, repoRoot });
  const npm = resolveNpmRoot({ env, repoRoot });
  const uuid = resolveUuidUtil({ env, repoRoot });
  return {
    version: ENGINE_VERSION,
    kit: kitDir(repoRoot),
    engine,
    npm,
    uuid,
    ready: Boolean(engine && npm && uuid),
  };
}

function kitMissingHelp(repoRoot) {
  const root = repoRoot || repoRootFrom(__dirname);
  return [
    `[runtime-kit] missing pinned ${ENGINE_VERSION} runtime (engine + packer).`,
    'Do not install Cocos Creator for this. Ask for the versioned kit:',
    `  ${path.join(root, 'runtime', ENGINE_VERSION)}/`,
    '  or HEADLESS_RUNTIME_URL → node spike/fetch-runtime.mjs',
    'Maintainers (who already have a bake) regenerate with:',
    '  node spike/bake-runtime.mjs --zip',
  ].join('\n');
}

module.exports = {
  ENGINE_VERSION,
  kitDir,
  kitStatus,
  kitMissingHelp,
  engineLooksReady,
  npmLooksReady,
  resolveEngineSnapshot,
  resolveNpmRoot,
  resolveUuidUtil,
};
