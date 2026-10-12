#!/usr/bin/env node
/**
 * Build on-demand platform (channel) packs from a full PinK / cocos-cli install.
 *
 * Policy:
 * - Ship only what the builder loads at runtime: package.json, dist/, static/, i18n/,
 *   and tools/ (OpenPaaS signing binaries). No node_modules, sources, or source maps;
 *   plugin requires (fs-extra, ejs, jszip) resolve from core's node_modules.
 * - Archive layout is `packages/platforms/<dir>/...`, extracted at the cocos-cli root
 *   by `kurenai packs ensure <id> --fetch`.
 * - Output layout is `{out}/{engineVersion}/platform/<dir>.tgz`, so `--out` can be
 *   served as KURENAI_COCOS_PACK_BASE_URL.
 *
 * platform:wechat ships in the @kurenai-studio/wechat-minigame npm package (manifest
 * `npm` field), so it is not packed by default; pass it explicitly for a tgz fallback.
 *
 * Usage:
 *   node scripts/pack-platform.mjs                      # platform:sudv2
 *   node scripts/pack-platform.mjs platform:wechat      # one pack (id or dir name)
 *   node scripts/pack-platform.mjs --all
 *   node scripts/pack-platform.mjs --source DIR --out DIR
 */
import { spawnSync } from 'node:child_process';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..');
const manifestPath = join(repoRoot, 'docs/cocos-cli-split.manifest.json');

const DEFAULT_SOURCE = join(
  homedir(),
  'Library/Application Support/cocos-default/cocos-4.0.0-alpha.33',
);
const DEFAULT_PACKS = ['platform:sudv2'];
const RUNTIME_ENTRIES = ['package.json', 'dist', 'static', 'i18n', 'tools'];
// Files PinK's plugins require but ship elsewhere: [from, to] inside the plugin dir.
const PATCH_COPIES = {
  // separateEngine requires ../static/cocos/signature.json; PinK ships it under templates.
  'platform:wechat': [['static/templates/cocos/signature.json', 'static/cocos/signature.json']],
};

function parseArgs(argv) {
  const options = { ids: [], all: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--source') options.source = argv[++i];
    else if (arg === '--out') options.out = argv[++i];
    else if (arg === '--all') options.all = true;
    else if (arg === '--help' || arg === '-h') options.help = true;
    else if (arg.startsWith('--')) throw new Error(`unknown arg: ${arg}`);
    else options.ids.push(arg);
  }
  return options;
}

function duBytes(path) {
  if (!existsSync(path)) return 0;
  const r = spawnSync('du', ['-sk', path], { encoding: 'utf8' });
  if (r.status === 0) {
    const kb = Number(r.stdout.trim().split(/\s+/)[0]);
    if (Number.isFinite(kb)) return kb * 1024;
  }
  return 0;
}

function mb(bytes) {
  return Math.round((bytes / 1024 / 1024) * 10) / 10;
}

function run(cmd, args, env) {
  const result = spawnSync(cmd, args, { encoding: 'utf8', env: env ?? process.env });
  if (result.status !== 0) {
    throw new Error(`${cmd} failed: ${result.stderr || result.stdout}`);
  }
  return result.stdout;
}

function resolvePack(manifest, ref) {
  const packs = manifest.packs.platform.packs;
  const pack = packs.find(
    (p) => p.id === ref || p.id === `platform:${ref}` || p.dir.endsWith(`/${ref}`),
  );
  if (!pack) {
    throw new Error(`unknown platform pack: ${ref} (known: ${packs.map((p) => p.id).join(', ')})`);
  }
  return pack;
}

function assertLoadable(packRoot, pack) {
  const pkg = JSON.parse(readFileSync(join(packRoot, 'package.json'), 'utf8'));
  const builder = pkg.contributes?.builder;
  if (!builder?.register) {
    throw new Error(`${pack.id}: package.json has no contributes.builder.register`);
  }
  for (const key of ['config', 'hooks']) {
    const entry = builder[key];
    if (entry && !existsSync(join(packRoot, `${entry.replace(/^\.\//, '')}.js`))) {
      throw new Error(`${pack.id}: builder.${key} (${entry}) missing from pack`);
    }
  }
  return { name: pkg.name, version: pkg.version, platform: builder.platform };
}

function buildPack(source, outRoot, version, pack) {
  const sourceDir = join(source, pack.dir);
  if (!existsSync(join(sourceDir, 'package.json'))) {
    throw new Error(`${pack.id}: source plugin missing: ${sourceDir}`);
  }

  const stage = join(tmpdir(), `kurenai-platform-pack-${process.pid}`);
  rmSync(stage, { recursive: true, force: true });
  const packRoot = join(stage, pack.dir);
  mkdirSync(packRoot, { recursive: true });

  const entries = RUNTIME_ENTRIES.filter((rel) => existsSync(join(sourceDir, rel)));
  for (const rel of entries) {
    const src = join(sourceDir, rel);
    const isDir = statSync(src).isDirectory();
    run('rsync', [
      '-a',
      '--exclude', '*.map',
      '--exclude', 'node_modules',
      '--exclude', '.DS_Store',
      isDir ? `${src}/` : src,
      isDir ? `${join(packRoot, rel)}/` : join(packRoot, rel),
    ]);
  }

  const patches = [];
  for (const [from, to] of PATCH_COPIES[pack.id] ?? []) {
    if (existsSync(join(packRoot, to)) || !existsSync(join(packRoot, from))) continue;
    mkdirSync(dirname(join(packRoot, to)), { recursive: true });
    copyFileSync(join(packRoot, from), join(packRoot, to));
    patches.push(`${from} -> ${to}`);
  }

  const builder = assertLoadable(packRoot, pack);
  const marker = {
    id: pack.id,
    dir: pack.dir,
    builder,
    engineVersion: version,
    source: sourceDir,
    builtAt: new Date().toISOString(),
    entries,
    patches,
    shipsNodeModules: false,
  };
  writeFileSync(join(packRoot, '.kurenai-pack.json'), `${JSON.stringify(marker, null, 2)}\n`);

  const tgz = join(outRoot, version, `${pack.id.replace(':', '/')}.tgz`);
  mkdirSync(dirname(tgz), { recursive: true });
  rmSync(tgz, { force: true });
  // COPYFILE_DISABLE keeps macOS tar from adding ._* AppleDouble entries.
  run('tar', ['-czf', tgz, '-C', stage, 'packages'], { ...process.env, COPYFILE_DISABLE: '1' });

  const result = {
    id: pack.id,
    platform: builder.platform,
    sourceMB: mb(duBytes(sourceDir)),
    unpackedMB: mb(duBytes(packRoot)),
    tgzMB: mb(duBytes(tgz)),
    tgz,
    patches,
  };
  rmSync(stage, { recursive: true, force: true });
  return result;
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    console.log(
      'usage: node scripts/pack-platform.mjs [platform:<id> ...] [--all] [--source DIR] [--out DIR]',
    );
    process.exit(0);
  }

  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  const version = manifest.measuredAgainst?.engineVersion || '4.0.0-alpha.33';
  const source = resolve(options.source || DEFAULT_SOURCE);
  const out = resolve(options.out || join(repoRoot, 'dist-packs'));
  const refs = options.all
    ? manifest.packs.platform.packs.map((p) => p.id)
    : options.ids.length
      ? options.ids
      : DEFAULT_PACKS;

  if (!existsSync(join(source, 'packages/platforms'))) {
    throw new Error(`source has no packages/platforms: ${source}`);
  }

  const packs = refs.map((ref) => buildPack(source, out, version, resolvePack(manifest, ref)));
  console.log(JSON.stringify({ ok: true, source, out, version, packs }, null, 2));
}

try {
  main();
} catch (error) {
  console.error(
    JSON.stringify({ ok: false, error: error instanceof Error ? error.message : String(error) }),
  );
  process.exit(1);
}
