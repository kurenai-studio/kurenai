#!/usr/bin/env node
/**
 * Re-trim vendor/cocos-core the way Enji does, while keeping Web publish.
 *
 *   node scripts/slim-vendor.mjs
 *   node scripts/slim-vendor.mjs --from <cocos-core> --out <dir>
 *   node scripts/slim-vendor.mjs --no-lock   # skip regenerating package-lock
 *
 * Default --from and --out are this repo's vendor/cocos-core (in-place via a
 * sibling temp directory). Rules follow enji/scripts/vendor-cocos-core.mjs, plus
 * engine TypeScript sources so `kurenai publish` can rebuild the engine. Engine-local
 * node_modules are never installed; publish gets what it needs from the `build` pack.
 */
import { spawnSync } from 'node:child_process';
import {
  copyFileSync,
  existsSync,
  linkSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const argValue = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};

const defaultVendor = join(repoRoot, 'vendor', 'cocos-core');
const from = resolve(argValue('--from') ?? defaultVendor);
const outArg = argValue('--out');
const inPlace = !outArg && from === defaultVendor;
const out = resolve(outArg ?? (inPlace ? join(repoRoot, 'vendor', 'cocos-core.slim-tmp') : defaultVendor));

/** Paths (relative to cocos-core, `/`-separated) that are never shipped. */
const DROP = [
  /(^|\/)node_modules(\/|$)/,
  /(^|\/)\.DS_Store$/,
  /\.map$/,
  /\.asm\.js(\.js)?$/, // wasm is always available in preview browsers
  // cocos-cli CLI / MCP / public API — kurenai drives the host and publish directly.
  /^dist\/(api|commands|display|lib|mcp|tests)\//,
  /^dist\/(cli|index)\.(js|d\.ts)$/,
  /^dist\/core\/scene\/scene-process\/(?!service\/operation\/types\.js$)/,
  /^dist\/core\/filesystem\//,
  /^dist\/core\/base\/sentry\.js$/,
  /\.d\.ts$/,
  // Editor / native packaging toolchain. Texture compression and lightmaps stay in PinK.
  /^workflow\//,
  /^static\/tools\/(?!cmft\/)/,
  /^packages\/(cocos-cli-types|engine-compiler)\//,
  /^\.kurenai-pack\.json$/,
  // Preview cache leftovers that Enji never ships.
  /^packages\/engine\/bin\/(dev|temp|adapter)\//,
];

/**
 * Inside packages/engine keep the prebuilt preview bundles, editor assets, and
 * the TypeScript sources. The rest of what publish needs comes from the `build` pack.
 */
const ENGINE_KEEP = [
  /^packages\/engine\/(package\.json|package-lock\.json|cc\.config\.json|LICENSE)$/,
  /^packages\/engine\/licenses\//,
  // Node preload needs editor/; the browser preview serves web/ (scripting-routes).
  // After copy, identical files under web/ and editor/ are hard-linked.
  /^packages\/engine\/bin\/\.cache\/dev-cli\/(web|editor)\/(bundled|external)\//,
  /^packages\/engine\/bin\/\.cache\/dev-cli\/(web|editor)\/(import-map|partial-import-map)\.json$/,
  /^packages\/engine\/bin\/\.cache\/dev-cli\/(web|editor)\/loader\.js$/,
  /^packages\/engine\/bin\/\.cache\/dev-cli\/VERSION$/,
  /^packages\/engine\/bin\/\.declarations\/cc\.d\.ts$/,
  /^packages\/engine\/bin\/\.editor\//,
  /^packages\/engine\/cocos\//,
  /^packages\/engine\/pal\//,
  /^packages\/engine\/exports\//,
  /^packages\/engine\/editor\/(assets|library|i18n|engine-features|exports)\//,
  /^packages\/engine\/editor\/(i18n-utils\.js|auto_material_settings\.json)$/,
  /^packages\/engine\/native\/external\/emscripten\//,
];

const FORCE_KEEP = [/^packages\/engine\/bin\/\.declarations\/cc\.d\.ts$/];

/** npm dependencies of cocos-cli that preview never loads (publish gets its own from the `build` pack). */
const DROP_DEPENDENCIES = [
  '@cocos/build-polyfills',
  '@cocos/creator-programming-rollup-plugin-mod-lo',
  '@cocos/fbx2gltf', // legacy FBX2glTF importer
  '@cocos/quick-compiler',
  '@microsoft/api-extractor',
  '@modelcontextprotocol/sdk',
  '@sentry/node',
  'cli-progress',
  'commander',
  'figlet',
  'globby',
  'gradient-string',
  'inquirer',
  'listr2',
  'max-rects-packing',
  'ora',
  'pino-pretty',
  'reflect-metadata',
  'replace-in-file',
  'rotating-file-stream',
  'xml2js',
  'xxtea-node',
  'zod',
  'zod-to-json-schema',
  'zod-to-ts',
];

const ADD_DEPENDENCIES = {
  '@cocos/systemjs': '1.0.4',
};

function keep(rel) {
  if (FORCE_KEEP.some((re) => re.test(rel))) return true;
  if (DROP.some((re) => re.test(rel))) return false;
  if (rel.startsWith('packages/engine/')) return ENGINE_KEEP.some((re) => re.test(rel));
  return true;
}

const INLINE_MAP = /\n\/\/# sourceMappingURL=data:application\/json;base64,[A-Za-z0-9+/=]+\s*$/;

function copyFile(src, dest, rel) {
  mkdirSync(dirname(dest), { recursive: true });
  if (rel.endsWith('.js') && (rel.startsWith('dist/') || rel.startsWith('packages/asset-db/dist/'))) {
    const text = readFileSync(src, 'utf8');
    const stripped = text.replace(INLINE_MAP, '\n');
    writeFileSync(dest, stripped);
    return stripped.length;
  }
  copyFileSync(src, dest);
  return statSync(dest).size;
}

function walk(dir, visit) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    const rel = relative(from, full).split('\\').join('/');
    if (entry.isDirectory()) {
      if (/(^|\/)node_modules$/.test(rel)) continue;
      walk(full, visit);
    } else if (entry.isFile()) {
      visit(full, rel);
    }
  }
}

function rewritePackageJson() {
  const path = join(out, 'package.json');
  const pkg = JSON.parse(readFileSync(path, 'utf8'));
  for (const name of DROP_DEPENDENCIES) delete pkg.dependencies?.[name];
  pkg.dependencies = Object.fromEntries(
    Object.entries({ ...pkg.dependencies, ...ADD_DEPENDENCIES }).sort(([a], [b]) => a.localeCompare(b)),
  );
  delete pkg.devDependencies;
  delete pkg.scripts;
  delete pkg.bin;
  delete pkg.main;
  pkg.files = undefined;
  pkg.private = true;
  writeFileSync(path, `${JSON.stringify(pkg, null, 4)}\n`);
  return Object.keys(pkg.dependencies ?? {}).length;
}

function restoreRuntimeMutatedFiles() {
  const rel = 'packages/engine/editor/library/.internal-info.json';
  const result = spawnSync('git', ['show', `HEAD:./vendor/cocos-core/${rel}`], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
  if (result.status === 0 && result.stdout) writeFileSync(join(out, rel), result.stdout);
}

function pruneLockfile() {
  const result = spawnSync(
    'npm',
    ['install', '--package-lock-only', '--omit=dev', '--ignore-scripts', '--no-audit', '--no-fund'],
    { cwd: out, stdio: 'inherit', shell: process.platform === 'win32' },
  );
  if (result.status !== 0) throw new Error('npm install --package-lock-only failed');
}

function npmInstall() {
  const result = spawnSync(
    'npm',
    ['install', '--omit=dev', '--ignore-scripts', '--no-audit', '--no-fund'],
    { cwd: out, stdio: 'inherit', shell: process.platform === 'win32' },
  );
  if (result.status !== 0) throw new Error('npm install failed');
}

function assertPublishSurface() {
  const required = [
    'dist/core/launcher.js',
    'dist/core/builder/platforms/web-desktop',
    'dist/core/builder/platforms/web-mobile',
    'packages/engine/bin/.cache/dev-cli/web/bundled/index.js',
    'packages/engine/bin/.cache/dev-cli/editor/loader.js',
    'packages/engine/cocos',
  ];
  for (const rel of required) {
    if (!existsSync(join(out, rel))) throw new Error(`slim incomplete: missing ${rel}`);
  }
  if (existsSync(join(out, 'dist/core/builder/platforms/android'))) {
    throw new Error('slim incorrect: android builder should stay out');
  }
}

/** Hard-link identical files under web/ and editor/ so the duplicate cache costs one copy. */
function hardlinkIdenticalCaches() {
  const web = join(out, 'packages/engine/bin/.cache/dev-cli/web');
  const editor = join(out, 'packages/engine/bin/.cache/dev-cli/editor');
  if (!existsSync(web) || !existsSync(editor)) return 0;
  let linked = 0;
  const walkDir = (dir, visit) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) walkDir(full, visit);
      else if (entry.isFile()) visit(full);
    }
  };
  walkDir(editor, (editorFile) => {
    const rel = relative(editor, editorFile);
    const webFile = join(web, rel);
    if (!existsSync(webFile)) return;
    try {
      if (statSync(editorFile).ino === statSync(webFile).ino) return;
    } catch {
      // continue
    }
    const a = readFileSync(editorFile);
    const b = readFileSync(webFile);
    if (a.length !== b.length) return;
    if (createHash('sha1').update(a).digest('hex') !== createHash('sha1').update(b).digest('hex')) return;
    unlinkSync(editorFile);
    linkSync(webFile, editorFile);
    linked += 1;
  });
  return linked;
}

function main() {
  if (!existsSync(join(from, 'dist', 'core', 'launcher.js'))) {
    throw new Error(`not a cocos-cli tree: ${from}`);
  }
  if (existsSync(out)) rmSync(out, { recursive: true, force: true });

  let files = 0;
  let bytes = 0;
  let dropped = 0;
  walk(from, (full, rel) => {
    if (!keep(rel)) {
      dropped += 1;
      return;
    }
    bytes += copyFile(full, join(out, rel), rel);
    files += 1;
  });

  mkdirSync(join(out, 'packages', 'platforms'), { recursive: true });
  writeFileSync(join(out, 'packages', 'platforms', '.gitkeep'), 'trimmed: mini-game platform packs install on demand\n');
  restoreRuntimeMutatedFiles();
  const dependencies = rewritePackageJson();
  if (!args.includes('--no-lock')) pruneLockfile();
  npmInstall();
  assertPublishSurface();
  const hardlinked = hardlinkIdenticalCaches();

  const source = JSON.parse(readFileSync(join(from, 'package.json'), 'utf8'));
  const engine = JSON.parse(readFileSync(join(from, 'packages', 'engine', 'package.json'), 'utf8'));
  const commit = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: repoRoot, encoding: 'utf8' });
  const manifest = {
    cocosCli: source.version,
    engine: engine.version,
    sourceCommit: commit.status === 0 ? commit.stdout.trim() : null,
    addedDependencies: ADD_DEPENDENCIES,
    vendoredAt: new Date().toISOString(),
    files,
    megabytes: Math.round(bytes / 1e5) / 10,
    droppedFiles: dropped,
    dependencies,
    droppedDependencies: DROP_DEPENDENCIES,
    keepsWebPublish: false,
    hardlinkedCacheFiles: hardlinked,
  };
  writeFileSync(join(out, 'KURENAI_VENDOR.json'), `${JSON.stringify(manifest, null, 2)}\n`);

  if (inPlace) {
    const backup = `${defaultVendor}.pre-slim`;
    if (existsSync(backup)) rmSync(backup, { recursive: true, force: true });
    renameSync(defaultVendor, backup);
    renameSync(out, defaultVendor);
    rmSync(backup, { recursive: true, force: true });
  }

  const du = spawnSync('du', ['-sh', inPlace ? defaultVendor : out], { encoding: 'utf8' });
  console.log(
    JSON.stringify(
      {
        ok: true,
        out: inPlace ? defaultVendor : out,
        disk: du.stdout.trim(),
        ...manifest,
      },
      null,
      2,
    ),
  );
}

main();
