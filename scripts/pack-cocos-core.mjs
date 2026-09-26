#!/usr/bin/env node
/**
 * Build a trimmed cocos **core** tree (web preview + asset-db + web publish)
 * from a full PinK / cocos-cli install.
 *
 * Policy:
 * - Do NOT ship the full node_modules tree; run `npm install --omit=dev` after extract.
 *   Exception: ship a few prebuilt native addons (gl / sharp / @ffprobe-installer) because
 *   node-gyp fails under paths with spaces (Application Support).
 * - Keep webgame builder modules in the main pack (web-desktop / web-mobile / web-common).
 * - Leave mini-game / native builder platforms out of the main pack.
 *
 * Usage:
 *   node scripts/pack-cocos-core.mjs --source /path/to/full-cocos-cli
 *   node scripts/pack-cocos-core.mjs --out vendor/cocos-core
 *   node scripts/pack-cocos-core.mjs --npm-install   # also npm install into --out
 *   npm run vendor:cocos                            # pack straight into vendor/cocos-core
 *
 * Optional `--tgz` still builds an archive for redistribution, but the product ships the source tree. */
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync, statSync } from 'node:fs';
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
  const options = { tgz: false, npmInstall: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--source') options.source = argv[++i];
    else if (arg === '--out') options.out = argv[++i];
    else if (arg === '--tgz') options.tgz = true;
    else if (arg === '--npm-install') options.npmInstall = true;
    else if (arg === '--drop-temp') options.dropTemp = true; // legacy no-op; temp already excluded
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
  const args = ['-a'];
  for (const ex of excludes) {
    if (ex.startsWith(`${rel}/`)) args.push('--exclude', ex.slice(rel.length + 1));
    else if (ex === rel) args.push('--exclude', '*');
  }
  const from = statSync(src).isDirectory() ? `${src}/` : src;
  const to = statSync(src).isDirectory() ? `${dest}/` : dest;
  if (statSync(src).isDirectory()) mkdirSync(dest, { recursive: true });
  const result = spawnSync('rsync', [...args, from, to], { encoding: 'utf8' });
  if (result.status !== 0) {
    throw new Error(`rsync failed for ${rel}: ${result.stderr || result.stdout}`);
  }
}

/** Copy a built package from source node_modules into a workspace path (no nested nm). */
function vendorWorkspacePackage(sourceRoot, destRoot, npmName, workspaceRel) {
  if (existsSync(join(destRoot, workspaceRel, 'package.json'))) return;
  const fromNm = join(sourceRoot, 'node_modules', ...npmName.split('/'));
  if (!existsSync(fromNm)) {
    console.warn(`[skip vendor] ${npmName} not in source node_modules`);
    return;
  }
  process.stdout.write(`vendor ${npmName} → ${workspaceRel} ... `);
  const t0 = Date.now();
  const dest = join(destRoot, workspaceRel);
  mkdirSync(dirname(dest), { recursive: true });
  const result = spawnSync(
    'rsync',
    ['-a', '--exclude', 'node_modules', `${fromNm}/`, `${dest}/`],
    { encoding: 'utf8' },
  );
  if (result.status !== 0) {
    throw new Error(`vendor ${npmName} failed: ${result.stderr || result.stdout}`);
  }
  console.log(`${Date.now() - t0}ms`);
}

function npmInstall(dir) {
  process.stdout.write(`npm install --omit=dev in ${dir} ... `);
  const t0 = Date.now();
  const result = spawnSync(
    'npm',
    // ignore-scripts: path-with-spaces breaks node-gyp for `gl`. Prebuilts are
    // copied from the source install afterwards (see copyPrebuiltNatives).
    ['install', '--omit=dev', '--ignore-scripts', '--no-audit', '--no-fund'],
    {
      cwd: dir,
      encoding: 'utf8',
      env: { ...process.env, npm_config_progress: 'false' },
    },
  );
  if (result.status !== 0) {
    throw new Error(`npm install failed: ${result.stderr || result.stdout}`);
  }
  console.log(`${Date.now() - t0}ms`);
}

/** Copy prebuilt native addons from a known-good install (paths with spaces break node-gyp). */
function copyPrebuiltNatives(sourceRoot, destRoot) {
  const natives = [
    // ffprobe only — gl removed; sharp replaced by packages/portable-sharp (jimp).
    { from: 'node_modules/@ffprobe-installer', stash: '.kurenai-prebuilts/@ffprobe-installer' },
  ];
  for (const { from, stash } of natives) {
    const src = join(sourceRoot, from);
    if (!existsSync(src)) {
      console.warn(`[skip native] ${from}`);
      continue;
    }
    process.stdout.write(`copy prebuilt ${from} ... `);
    const t0 = Date.now();
    for (const rel of [from, stash]) {
      const dest = join(destRoot, rel);
      mkdirSync(dirname(dest), { recursive: true });
      rmSync(dest, { recursive: true, force: true });
      const result = spawnSync('rsync', ['-a', `${src}/`, `${dest}/`], { encoding: 'utf8' });
      if (result.status !== 0) {
        throw new Error(`copy prebuilt ${rel} failed: ${result.stderr || result.stdout}`);
      }
    }
    console.log(`${Date.now() - t0}ms`);
  }
}

function basenameSafe(path) {
  const parts = path.split(/[/\\]/).filter(Boolean);
  return parts[parts.length - 1];
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    console.log(
      'usage: node scripts/pack-cocos-core.mjs [--source DIR] [--out DIR] [--tgz] [--npm-install]',
    );
    process.exit(0);
  }

  ensureRsync();
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  const version = manifest.measuredAgainst?.engineVersion || '4.0.0-alpha.33';
  const source = resolve(options.source || DEFAULT_SOURCE);
  const out = resolve(
    options.out || join(repoRoot, 'vendor', 'cocos-core'),
  );

  if (!existsSync(join(source, 'dist/cli.js'))) {
    throw new Error(`source does not look like cocos-cli (missing dist/cli.js): ${source}`);
  }

  console.log(
    JSON.stringify(
      {
        phase: 'start',
        source,
        out,
        version,
        policy: 'no full node_modules; portable-sharp (jimp) + prebuilt ffprobe only; web builders in main pack',
      },
      null,
      2,
    ),
  );

  mkdirSync(dirname(out), { recursive: true });
  rmSync(out, { recursive: true, force: true });
  mkdirSync(out, { recursive: true });

  const includes = manifest.packs.core.include.map(stripGlob);
  const seen = new Set();
  const uniqueIncludes = includes.filter((rel) => (seen.has(rel) ? false : (seen.add(rel), true)));
  const excludes = manifest.packs.core.exclude.map(stripGlob);

  for (const rel of uniqueIncludes) {
    const nestedExcludes = excludes.filter((ex) => ex === rel || ex.startsWith(`${rel}/`));
    process.stdout.write(`copy ${rel} ... `);
    const t0 = Date.now();
    rsyncPath(source, out, rel, nestedExcludes);
    console.log(`${Date.now() - t0}ms`);
  }

  // PinK lockfile links @cocos/asset-db → packages/asset-db, but the workspace
  // dir is often missing from the install tree. Vendor the built package so
  // `npm install` can recreate the link.
  vendorWorkspacePackage(source, out, '@cocos/asset-db', 'packages/asset-db');

  mkdirSync(join(out, 'packages/platforms'), { recursive: true });
  writeFileSync(
    join(out, 'packages/platforms/.gitkeep'),
    'trimmed: mini-game platform packs install on demand\n',
  );

  // Native addons cannot reliably rebuild under paths with spaces; ship the
  // few prebuilt packages inside the core tarball (still not the full nm tree).
  copyPrebuiltNatives(source, out);

  // Assert web builders present, native builders absent
  const webDesktop = join(out, 'dist/core/builder/platforms/web-desktop');
  const androidBuilder = join(out, 'dist/core/builder/platforms/android');
  if (!existsSync(webDesktop)) {
    throw new Error('pack incomplete: web-desktop builder missing from main pack');
  }
  if (existsSync(androidBuilder)) {
    throw new Error('pack incorrect: android builder should stay out of main pack');
  }
  if (existsSync(join(out, 'node_modules/@babel'))) {
    throw new Error('pack incorrect: full node_modules tree must not be copied into the core tarball');
  }

  const marker = {
    id: 'core',
    engineVersion: version,
    cocosCliPackageVersion: manifest.measuredAgainst?.cocosCliPackageVersion,
    source,
    builtAt: new Date().toISOString(),
    shipsNodeModules: false,
    shipsPrebuiltNatives: ['@ffprobe-installer'],
    imageBackend: 'packages/portable-sharp (jimp)',
    effectGpuTypecheck: false,
    postInstall: manifest.packs.core.postInstall || 'npm install --omit=dev',
    keepInMainPack: manifest.packs.core.keepInMainPack,
    excludes,
  };
  writeFileSync(join(out, '.kurenai-pack.json'), `${JSON.stringify(marker, null, 2)}\n`);

  if (!existsSync(join(out, 'dist/cli.js'))) {
    throw new Error('pack incomplete: dist/cli.js missing in output');
  }

  const packedBytes = duBytes(out);

  let tgzPath;
  if (options.tgz) {
    tgzPath = join(dirname(out), `kurenai-cocos-core-${version}.tgz`);
    rmSync(tgzPath, { force: true });
    process.stdout.write(`tar ${tgzPath} ... `);
    const t0 = Date.now();
    const tar = spawnSync('tar', ['-czf', tgzPath, '-C', dirname(out), basenameSafe(out)], {
      encoding: 'utf8',
    });
    if (tar.status !== 0) throw new Error(`tar failed: ${tar.stderr}`);
    console.log(`${Date.now() - t0}ms (${mb(duBytes(tgzPath))} MB)`);
  }

  let installedMB;
  if (options.npmInstall) {
    npmInstall(out);
    if (existsSync(join(out, 'packages/engine/package.json'))) {
      npmInstall(join(out, 'packages/engine'));
    }
    copyPrebuiltNatives(source, out);
    installedMB = mb(duBytes(out));
  }

  const summary = {
    ok: true,
    source,
    out,
    version,
    sourceMB: mb(duBytes(source)),
    corePackedMB: mb(packedBytes),
    coreWithNpmMB: installedMB,
    tgzMB: tgzPath ? mb(duBytes(tgzPath)) : undefined,
    tgz: tgzPath,
    marker: join(out, '.kurenai-pack.json'),
    note: 'tarball: no full node_modules; portable-sharp/jimp; prebuilt ffprobe only; npm install --omit=dev after extract; web builders in main pack',
  };
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
