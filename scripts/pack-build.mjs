#!/usr/bin/env node
/**
 * Build the on-demand core build pack (`build.tgz`) from a full PinK / cocos-cli install.
 *
 * The slim vendor tree (scripts/slim-vendor.mjs) is enough for preview. Building a game
 * (`kurenai publish`) also needs:
 * - engine build inputs the slim tree drops: tsconfig.json, @types, extensions/, external/,
 *   launcher + web/mini-game templates, emscripten *.asm.js fallbacks and *.d.ts;
 * - the npm packages the builder loads, copied as PinK resolved them (same versions, no
 *   npm at publish time), minus packages vendor/cocos-core already has at the same path
 *   and version;
 * - the engine-local packages that optional engine modules import (physics, dragonbones),
 *   instead of the whole 203 MB packages/engine/node_modules.
 *
 * Archive paths are relative to the cocos-cli root; output is `{out}/{engineVersion}/build.tgz`.
 *
 * Usage:
 *   node scripts/pack-build.mjs [--source DIR] [--base DIR] [--out DIR]
 */
import { spawnSync } from 'node:child_process';
import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..');
const manifestPath = join(repoRoot, 'docs/cocos-cli-split.manifest.json');

const DEFAULT_SOURCE = join(
  homedir(),
  'Library/Application Support/cocos-default/cocos-4.0.0-alpha.33',
);

function parseArgs(argv) {
  const options = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--source') options.source = argv[++i];
    else if (arg === '--base') options.base = argv[++i];
    else if (arg === '--out') options.out = argv[++i];
    else if (arg === '--help' || arg === '-h') options.help = true;
    else throw new Error(`unknown arg: ${arg}`);
  }
  return options;
}

function mb(bytes) {
  return Math.round((bytes / 1024 / 1024) * 10) / 10;
}

function duBytes(path) {
  const r = spawnSync('du', ['-sk', path], { encoding: 'utf8' });
  return r.status === 0 ? Number(r.stdout.trim().split(/\s+/)[0]) * 1024 : 0;
}

function readVersion(pkgDir) {
  const file = join(pkgDir, 'package.json');
  return existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')).version : undefined;
}

/** Node's lookup: <dir>/node_modules/<name>, walking up to the cocos-cli root. */
function resolvePackageDir(root, fromDir, name) {
  let dir = fromDir;
  for (;;) {
    const candidate = join(dir, 'node_modules', name);
    if (existsSync(join(candidate, 'package.json'))) return candidate;
    if (dir === root) return undefined;
    dir = dirname(dir);
  }
}

/** Every package directory the given dependencies load, as PinK resolved them from `from`. */
function dependencyClosure(source, roots) {
  const seen = new Map();
  const missing = [];
  const queue = roots.flatMap(({ names, from }) =>
    names.map((name) => ({ name, from, optional: false })),
  );
  while (queue.length) {
    const { name, from, optional } = queue.shift();
    const dir = resolvePackageDir(source, from, name);
    if (!dir) {
      if (!optional) missing.push(`${name} (from ${relative(source, from) || '.'})`);
      continue;
    }
    const rel = relative(source, dir);
    if (seen.has(rel)) continue;
    const pkg = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'));
    seen.set(rel, pkg.version);
    for (const dep of Object.keys(pkg.dependencies ?? {})) queue.push({ name: dep, from: dir, optional: false });
    for (const dep of Object.keys(pkg.optionalDependencies ?? {})) queue.push({ name: dep, from: dir, optional: true });
    for (const dep of Object.keys(pkg.peerDependencies ?? {})) queue.push({ name: dep, from: dir, optional: true });
  }
  return { packages: seen, missing };
}

function listFiles(dir, predicate, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) listFiles(full, predicate, out);
    else if (predicate(full)) out.push(full);
  }
  return out;
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    console.log('usage: node scripts/pack-build.mjs [--source DIR] [--base DIR] [--out DIR]');
    process.exit(0);
  }

  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  const spec = manifest.packs.build;
  const version = manifest.measuredAgainst?.engineVersion || '4.0.0-alpha.33';
  const source = resolve(options.source || DEFAULT_SOURCE);
  const base = resolve(options.base || join(repoRoot, 'vendor', 'cocos-core'));
  const out = resolve(options.out || join(repoRoot, 'dist-packs'));
  if (!existsSync(join(source, 'packages/engine/tsconfig.json'))) {
    throw new Error(`source is not a full cocos-cli install: ${source}`);
  }
  if (!existsSync(join(base, 'node_modules'))) {
    throw new Error(`base has no node_modules (run npm install in it first): ${base}`);
  }

  const closure = dependencyClosure(source, [
    { names: spec.npmPackages, from: source },
    { names: spec.engineNpmPackages ?? [], from: join(source, 'packages/engine') },
  ]);
  if (closure.missing.length) {
    throw new Error(`unresolved dependencies in source: ${closure.missing.join(', ')}`);
  }
  const packages = [];
  const conflicts = [];
  for (const [rel, sourceVersion] of closure.packages) {
    const baseVersion = readVersion(join(base, rel));
    if (baseVersion === sourceVersion) continue;
    if (baseVersion !== undefined) conflicts.push(`${rel}: base ${baseVersion}, build ${sourceVersion}`);
    packages.push(rel);
  }
  if (conflicts.length) {
    throw new Error(`build packages would replace different versions in core:\n${conflicts.join('\n')}`);
  }

  const stage = join(tmpdir(), `kurenai-build-pack-${process.pid}`);
  rmSync(stage, { recursive: true, force: true });
  mkdirSync(stage, { recursive: true });

  for (const rel of [...spec.engineFiles, ...packages]) {
    const from = join(source, rel);
    if (!existsSync(from)) throw new Error(`missing in source: ${rel}`);
    // Nested node_modules are separate closure entries; copy each package on its own.
    cpSync(from, join(stage, rel), {
      recursive: true,
      filter: (path) => !relative(from, path).split(/[/\\]/).includes('node_modules'),
    });
  }

  const emscripten = join(source, spec.emscriptenDir);
  const emscriptenFiles = listFiles(emscripten, (file) =>
    spec.emscriptenSuffixes.some((suffix) => file.endsWith(suffix)),
  );
  for (const file of emscriptenFiles) {
    const rel = relative(source, file);
    mkdirSync(dirname(join(stage, rel)), { recursive: true });
    cpSync(file, join(stage, rel));
  }

  const marker = {
    id: spec.id,
    engineVersion: version,
    source,
    base,
    builtAt: new Date().toISOString(),
    npmPackages: spec.npmPackages,
    engineNpmPackages: spec.engineNpmPackages ?? [],
    packageDirs: packages.length,
    engineFiles: spec.engineFiles,
    emscriptenFiles: emscriptenFiles.length,
  };
  writeFileSync(join(stage, '.kurenai-build-pack.json'), `${JSON.stringify(marker, null, 2)}\n`);

  const tgz = join(out, version, `${spec.id}.tgz`);
  mkdirSync(dirname(tgz), { recursive: true });
  rmSync(tgz, { force: true });
  const entries = readdirSync(stage);
  const tar = spawnSync('tar', ['-czf', tgz, '-C', stage, ...entries], {
    encoding: 'utf8',
    env: { ...process.env, COPYFILE_DISABLE: '1' },
  });
  if (tar.status !== 0) throw new Error(`tar failed: ${tar.stderr}`);

  const summary = {
    ok: true,
    id: spec.id,
    source,
    base,
    version,
    packageDirs: packages.length,
    nodeModulesMB: mb(existsSync(join(stage, 'node_modules')) ? duBytes(join(stage, 'node_modules')) : 0),
    engineMB: mb(duBytes(join(stage, 'packages'))),
    unpackedMB: mb(duBytes(stage)),
    tgzMB: mb(statSync(tgz).size),
    tgz,
  };
  rmSync(stage, { recursive: true, force: true });
  console.log(JSON.stringify(summary, null, 2));
}

try {
  main();
} catch (error) {
  console.error(
    JSON.stringify({ ok: false, error: error instanceof Error ? error.message : String(error) }),
  );
  process.exit(1);
}
