#!/usr/bin/env node
/**
 * Build a trimmed cocos **core** tree (web preview + asset-db + web publish)
 * from a full PinK / cocos-cli install.
 *
 * Usage:
 *   node scripts/pack-cocos-core.mjs
 *   node scripts/pack-cocos-core.mjs --source /path/to/full-cocos-cli
 *   node scripts/pack-cocos-core.mjs --out ~/Library/Application\ Support/kurenai/cocos-core/4.0.0-alpha.33
 *   node scripts/pack-cocos-core.mjs --tgz   # also write core.tgz next to --out
 *   node scripts/pack-cocos-core.mjs --drop-temp  # also omit packages/engine/bin/temp
 *
 * Reads include/exclude from docs/cocos-cli-split.manifest.json.
 */
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync, cpSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..');
const manifestPath = join(repoRoot, 'docs/cocos-cli-split.manifest.json');

const DEFAULT_SOURCE = join(
  homedir(),
  'Library/Application Support/cocos-default/cocos-4.0.0-alpha.33',
);

function parseArgs(argv) {
  const options = { tgz: false, dropTemp: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--source') options.source = argv[++i];
    else if (arg === '--out') options.out = argv[++i];
    else if (arg === '--tgz') options.tgz = true;
    else if (arg === '--drop-temp') options.dropTemp = true;
    else if (arg === '--help' || arg === '-h') options.help = true;
    else throw new Error(`unknown arg: ${arg}`);
  }
  return options;
}

function stripGlob(p) {
  return p.replace(/\/\*\*$/, '');
}

function duBytes(path) {
  if (!existsSync(path)) return 0;
  const st = statSync(path);
  if (st.isFile()) return st.size;
  let total = 0;
  // prefer `du -sk` for speed on large trees
  const r = spawnSync('du', ['-sk', path], { encoding: 'utf8' });
  if (r.status === 0) {
    const kb = Number(r.stdout.trim().split(/\s+/)[0]);
    if (Number.isFinite(kb)) return kb * 1024;
  }
  return total;
}

function mb(bytes) {
  return Math.round((bytes / 1024 / 1024) * 10) / 10;
}

function ensureRsync() {
  const r = spawnSync('rsync', ['--version'], { encoding: 'utf8' });
  if (r.status !== 0) throw new Error('rsync is required to pack cocos core');
}

function rsyncPath(sourceRoot, destRoot, rel, excludes) {
  const src = join(sourceRoot, rel);
  if (!existsSync(src)) {
    console.warn(`[skip missing] ${rel}`);
    return;
  }
  const dest = join(destRoot, rel);
  mkdirSync(dirname(dest), { recursive: true });
  const args = ['-a', '--delete'];
  for (const ex of excludes) {
    // rsync exclude is relative to the transferred root when using trailing slash
    if (ex.startsWith(`${rel}/`)) {
      args.push('--exclude', ex.slice(rel.length + 1));
    } else if (rel === '.' && ex) {
      args.push('--exclude', ex);
    }
  }
  const from = statSync(src).isDirectory() ? `${src}/` : src;
  const to = statSync(src).isDirectory() ? `${dest}/` : dest;
  if (statSync(src).isDirectory()) mkdirSync(dest, { recursive: true });
  const result = spawnSync('rsync', [...args, from, to], { encoding: 'utf8' });
  if (result.status !== 0) {
    throw new Error(`rsync failed for ${rel}: ${result.stderr || result.stdout}`);
  }
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    console.log(`usage: node scripts/pack-cocos-core.mjs [--source DIR] [--out DIR] [--tgz] [--drop-temp]`);
    process.exit(0);
  }

  ensureRsync();
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  const version = manifest.measuredAgainst?.engineVersion || '4.0.0-alpha.33';
  const source = resolve(options.source || DEFAULT_SOURCE);
  // Never default source to KURENAI_COCOS_CLI_ROOT — that may already be the trimmed out dir.
  const out = resolve(
    options.out ||
      join(homedir(), 'Library/Application Support/kurenai/cocos-core', version),
  );

  if (!existsSync(join(source, 'dist/cli.js'))) {
    throw new Error(`source does not look like cocos-cli (missing dist/cli.js): ${source}`);
  }

  console.log(JSON.stringify({ phase: 'start', source, out, version }, null, 2));

  mkdirSync(dirname(out), { recursive: true });
  // Fresh tree
  rmSync(out, { recursive: true, force: true });
  mkdirSync(out, { recursive: true });

  const includes = manifest.packs.core.include.map(stripGlob);
  // Deduplicate while preserving order (engine before emscripten re-include).
  const seen = new Set();
  const uniqueIncludes = includes.filter((rel) => (seen.has(rel) ? false : (seen.add(rel), true)));
  const excludes = manifest.packs.core.exclude.map(stripGlob);
  if (options.dropTemp) excludes.push('packages/engine/bin/temp');

  for (const rel of uniqueIncludes) {
    const nestedExcludes = excludes.filter((ex) => ex === rel || ex.startsWith(`${rel}/`));
    process.stdout.write(`copy ${rel} ... `);
    const t0 = Date.now();
    rsyncPath(source, out, rel, nestedExcludes);
    console.log(`${Date.now() - t0}ms`);
  }

  // Keep empty platforms dir so cocos-cli scanner does not crash
  mkdirSync(join(out, 'packages/platforms'), { recursive: true });
  writeFileSync(
    join(out, 'packages/platforms/.gitkeep'),
    'trimmed: platform packs install on demand\n',
  );

  // Marker for kurenai resolve / ensure
  const marker = {
    id: 'core',
    engineVersion: version,
    cocosCliPackageVersion: manifest.measuredAgainst?.cocosCliPackageVersion,
    source,
    builtAt: new Date().toISOString(),
    dropTemp: Boolean(options.dropTemp),
    excludes,
  };
  writeFileSync(join(out, '.kurenai-pack.json'), `${JSON.stringify(marker, null, 2)}\n`);

  if (!existsSync(join(out, 'dist/cli.js'))) {
    throw new Error('pack incomplete: dist/cli.js missing in output');
  }

  const outBytes = duBytes(out);
  const sourceBytes = duBytes(source);
  let tgzPath;
  if (options.tgz) {
    tgzPath = join(dirname(out), `kurenai-cocos-core-${version}.tgz`);
    rmSync(tgzPath, { force: true });
    process.stdout.write(`tar ${tgzPath} ... `);
    const t0 = Date.now();
    const tar = spawnSync(
      'tar',
      ['-czf', tgzPath, '-C', dirname(out), basenameSafe(out)],
      { encoding: 'utf8' },
    );
    if (tar.status !== 0) throw new Error(`tar failed: ${tar.stderr}`);
    console.log(`${Date.now() - t0}ms (${mb(duBytes(tgzPath))} MB)`);
  }

  const summary = {
    ok: true,
    source,
    out,
    version,
    sourceMB: mb(sourceBytes),
    coreMB: mb(outBytes),
    savedMB: mb(sourceBytes - outBytes),
    tgz: tgzPath,
    marker: join(out, '.kurenai-pack.json'),
  };
  console.log(JSON.stringify(summary, null, 2));
}

function basenameSafe(path) {
  const parts = path.split(/[/\\]/).filter(Boolean);
  return parts[parts.length - 1];
}

try {
  main();
} catch (error) {
  console.error(JSON.stringify({ ok: false, error: error instanceof Error ? error.message : String(error) }));
  process.exit(1);
}
