import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { bundleIndexJs } from '../lib/scan.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Tracked shell helpers (spike/cache is gitignored).
const SPIKE_CACHE = path.resolve(__dirname, '../shell');
const SPIKE_CACHE_FALLBACK = path.resolve(__dirname, '../../cache');

function shellFile(name) {
  const primary = path.join(SPIKE_CACHE, name);
  if (fs.existsSync(primary)) return primary;
  return path.join(SPIKE_CACHE_FALLBACK, name);
}

const EMPTY_FEATURE_JS =
  'System.register([], function (_export, _context) {\n' +
  '  return { setters: [], execute: function () {} };\n' +
  '});\n';

const SOCKET_IO_STUB_JS =
  'System.register([], function (_export, _context) {\n' +
  '  "use strict";\n' +
  '  function noop() {}\n' +
  '  function io() {\n' +
  '    return { on: noop, off: noop, emit: noop, disconnect: noop, close: noop };\n' +
  '  }\n' +
  '  _export("default", io);\n' +
  '  return { setters: [], execute: function () {} };\n' +
  '});\n';

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

/** Match preview-mirror rewriteIndexHtml for static dist. */
function rewriteIndexHtml(html) {
  if (!html.includes('data-headless-remote-console="1"')) {
    html = html.replace(
      '<head>',
      '<head>\n<script src="/scripting/headless-remote-console.js" data-headless-remote-console="1"></script>',
    );
  }
  if (!html.includes('data-headless-q-stubs="1"')) {
    html = html.replace(
      '<!-- SystemJS support. -->',
      '<script type="systemjs-importmap" data-headless-q-stubs="1" src="/scripting/headless-q-stubs.json"></script>\n<!-- SystemJS support. -->',
    );
  }
  if (!html.includes('/scripting/headless-boot.js')) {
    html = html.replace(
      '<script src="/scripting/engine/bin/.cache/dev/preview/bundled/index.js"></script>',
      '<script src="/scripting/headless-boot.js" data-headless-boot.js="1"></script>',
    );
  }
  return html;
}

function copyHeadlessRuntime(outDir, files, warnings) {
  const scripting = path.join(outDir, 'scripting');
  ensureDir(scripting);
  for (const name of [
    'headless-boot.js',
    'headless-remote-console.js',
    'headless-q-stubs.json',
    'remote-console.local.json',
  ]) {
    const src = shellFile(name);
    if (!fs.existsSync(src)) {
      warnings.push(`missing cache file: ${name}`);
      continue;
    }
    copyFile(src, path.join(scripting, name));
    files.push(`scripting/${name}`);
  }
  fs.writeFileSync(path.join(scripting, 'empty-feature.js'), EMPTY_FEATURE_JS, 'utf8');
  files.push('scripting/empty-feature.js');

  // preview-app always imports /socket.io/socket.io.js for HMR; static dist needs a noop.
  fs.writeFileSync(path.join(outDir, 'socket.io', 'socket.io.js'), SOCKET_IO_STUB_JS, 'utf8');
  files.push('socket.io/socket.io.js');

  // Custom pipeline layout graph (same path preview-mirror serves).
  const effectSrc = path.join(
    path.dirname(path.dirname(outDir)), // project/dist/web → project
    'temp',
    'asset-db',
    'effect',
    'effect.bin',
  );
  // outDir is project/dist/web → project is ../..
  const projectGuess = path.resolve(outDir, '../..');
  const effectCandidates = [
    path.join(projectGuess, 'temp/asset-db/effect/effect.bin'),
    effectSrc,
  ];
  for (const cand of effectCandidates) {
    if (fs.existsSync(cand)) {
      copyFile(cand, path.join(outDir, 'src', 'effect.bin'));
      files.push('src/effect.bin');
      break;
    }
  }

  const indexPath = path.join(outDir, 'index.html');
  if (fs.existsSync(indexPath)) {
    const rewritten = rewriteIndexHtml(fs.readFileSync(indexPath, 'utf8'));
    fs.writeFileSync(indexPath, rewritten, 'utf8');
  }
}

function copyFile(src, dest) {
  ensureDir(path.dirname(dest));
  fs.copyFileSync(src, dest);
}

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return 0;
  let n = 0;
  const walk = (from, to) => {
    ensureDir(to);
    for (const name of fs.readdirSync(from)) {
      const a = path.join(from, name);
      const b = path.join(to, name);
      if (fs.statSync(a).isDirectory()) walk(a, b);
      else {
        fs.copyFileSync(a, b);
        n++;
      }
    }
  };
  walk(src, dest);
  return n;
}

function libLookup(libraryRoot, internalRoot, uuid) {
  const relDir = uuid.slice(0, 2);
  for (const root of [libraryRoot, internalRoot]) {
    if (!root || !fs.existsSync(root)) continue;
    const dir = path.join(root, relDir);
    if (!fs.existsSync(dir)) continue;
    const hits = fs.readdirSync(dir).filter((f) => f.startsWith(uuid));
    if (hits.length) return hits.map((f) => path.join(dir, f));
  }
  return [];
}

function copyUuidsIntoBundle(ir, bundleName, uuids, outAssets) {
  const importBase = path.join(outAssets, bundleName, 'import');
  const nativeBase = path.join(outAssets, bundleName, 'native');
  let copied = 0;
  const missing = [];
  for (const uuid of uuids) {
    if (!uuid || typeof uuid !== 'string') continue;
    const files = libLookup(ir.libraryRoot, ir.internalLibraryRoot, uuid);
    if (!files.length) {
      missing.push(uuid);
      continue;
    }
    for (const file of files) {
      const base = path.basename(file);
      const shard = uuid.slice(0, 2);
      // Heuristic: .png/.mp3/.ttf under uuid/ or sibling bytes → native; .json → import
      const ext = path.extname(file).toLowerCase();
      const isImport =
        ext === '.json' || ext === '.cconb' || (ext === '.bin' && !file.includes(`${path.sep}${uuid}${path.sep}`));
      // Creator preview often keeps natives as `${uuid}.png` next to json in library shard
      const destRoot = isImport || ['.json', '.cconb'].includes(ext) ? importBase : nativeBase;
      // Prefer: json/cconb → import; other binary extensions → native; directories under uuid/ → native
      let dest;
      if (ext === '.json' || ext === '.cconb') {
        dest = path.join(importBase, shard, base);
      } else if (fs.statSync(file).isFile() && ['.png', '.jpg', '.jpeg', '.webp', '.mp3', '.wav', '.ogg', '.ttf', '.plist', '.bin'].includes(ext)) {
        dest = path.join(nativeBase, shard, base);
      } else {
        dest = path.join(importBase, shard, base);
      }
      copyFile(file, dest);
      copied++;
      // Also copy nested native folder library/xx/uuid/*
      const nested = path.join(path.dirname(file), uuid);
      if (fs.existsSync(nested) && fs.statSync(nested).isDirectory()) {
        copied += copyDir(nested, path.join(nativeBase, shard, uuid));
      }
    }
  }
  return { copied, missing };
}

function collectConfigUuids(config) {
  const set = new Set();
  if (Array.isArray(config.uuids)) for (const u of config.uuids) set.add(u);
  if (config.paths) for (const u of Object.keys(config.paths)) set.add(u);
  if (config.scenes) for (const u of Object.values(config.scenes)) if (typeof u === 'string') set.add(u);
  return [...set];
}

/** Copy every library shard file into assets/<bundle>/{import,native}. */
function copyEntireLibraryIntoBundle(libraryRoot, bundleRoot) {
  if (!libraryRoot || !fs.existsSync(libraryRoot)) return 0;
  let n = 0;
  const importBase = path.join(bundleRoot, 'import');
  const nativeBase = path.join(bundleRoot, 'native');
  for (const shard of fs.readdirSync(libraryRoot)) {
    const shardDir = path.join(libraryRoot, shard);
    if (!fs.statSync(shardDir).isDirectory()) continue;
    if (!/^[0-9a-f]{2}$/i.test(shard)) continue;
    for (const name of fs.readdirSync(shardDir)) {
      const src = path.join(shardDir, name);
      const st = fs.statSync(src);
      if (st.isDirectory()) {
        n += copyDir(src, path.join(nativeBase, shard, name));
        continue;
      }
      const ext = path.extname(name).toLowerCase();
      const destRoot =
        ext === '.json' || ext === '.cconb' ? importBase : nativeBase;
      // .bin next to mesh/prefab JSON still goes under import for Cocos downloaders
      // that request import/*.bin after query-extname → .cconb remap; keep both:
      // json → import, binary textures/audio → native, other .bin → import.
      let dest;
      if (ext === '.json' || ext === '.cconb') {
        dest = path.join(importBase, shard, name);
      } else if (['.png', '.jpg', '.jpeg', '.webp', '.mp3', '.wav', '.ogg', '.ttf', '.plist'].includes(ext)) {
        dest = path.join(nativeBase, shard, name);
      } else {
        dest = path.join(importBase, shard, name);
      }
      copyFile(src, dest);
      n++;
    }
  }
  return n;
}

/**
 * @type {import('./types.mjs').PlatformPlugin}
 */
export const webPlatform = {
  id: 'web',
  async emit(ir, ctx) {
    const log = ctx.log || (() => {});
    const outDir = path.resolve(ctx.outDir);
    const warnings = [];
    const files = [];

    try {
      if (fs.existsSync(outDir)) fs.rmSync(outDir, { recursive: true, force: true });
      ensureDir(outDir);

      // Shell
      for (const name of [
        'index.html',
        'index.css',
        'favicon.ico',
        'polyfills-bundle.js',
        'systemjs-system.js',
        'import-map-global.json',
        'preview-app-index.js',
        'preview-app-main.js',
        'preview-app-ui.js',
      ]) {
        const src = path.join(ir.shellCacheRoot, name);
        if (!fs.existsSync(src)) {
          warnings.push(`missing shell file: ${name}`);
          continue;
        }
        if (name === 'polyfills-bundle.js') {
          copyFile(src, path.join(outDir, 'scripting', 'polyfills', 'bundle.js'));
        } else if (name === 'systemjs-system.js') {
          copyFile(src, path.join(outDir, 'scripting', 'systemjs', 'system.js'));
        } else if (name === 'import-map-global.json') {
          copyFile(src, path.join(outDir, 'scripting', 'import-map-global'));
        } else if (name.startsWith('preview-app-')) {
          copyFile(src, path.join(outDir, 'preview-app', name.replace('preview-app-', '').replace('.js', '') + '.js'));
        } else {
          copyFile(src, path.join(outDir, name));
        }
        files.push(name);
      }

      // Fix preview-app paths: cache files are preview-app-index.js → preview-app/index.js
      // rewrite above maps preview-app-index.js → preview-app/index.js via replace — verify:
      // 'preview-app-index.js'.replace('preview-app-', '').replace('.js','') + '.js' = 'index.js' ✓

      fs.writeFileSync(path.join(outDir, 'settings.js'), ir.settingsJs, 'utf8');
      files.push('settings.js');

      // Engine
      const engDest = path.join(outDir, 'scripting', 'engine', 'bin', '.cache', 'dev', 'preview');
      log(`copy engine → ${engDest}`);
      copyDir(ir.enginePreviewRoot, engDest);
      if (fs.existsSync(ir.engineNativeExternal)) {
        copyDir(ir.engineNativeExternal, path.join(outDir, 'native-external'));
      }

      // Scripts: Creator preview packer provides engine virtual modules
      // (cce:/internal/x/cc, prerequisite-imports, …). Mini/build only has user
      // scripts — same overlay strategy as preview-mirror.
      const scriptsDest = path.join(outDir, 'scripting', 'x');
      const previewPack = path.join(
        ir.projectRoot,
        'temp/programming/packer-driver/targets/preview',
      );
      log(`copy scripts → ${scriptsDest}`);
      if (fs.existsSync(previewPack)) {
        copyDir(previewPack, scriptsDest);
        // Overlay freshly built user chunks (and any records from mini/build).
        const overlayChunks = path.join(ir.scriptsRoot, 'chunks');
        if (fs.existsSync(overlayChunks)) {
          copyDir(overlayChunks, path.join(scriptsDest, 'chunks'));
        }
      } else {
        copyDir(ir.scriptsRoot, scriptsDest);
        warnings.push(
          'Creator preview packer missing; cce:/internal/x/cc may fail to load',
        );
      }

      // Assets: internal from cache + engine builtinAssets from project library
      const outAssets = path.join(outDir, 'assets');
      const internalSrc = path.join(ir.shellCacheRoot, 'assets', 'internal');
      if (fs.existsSync(internalSrc)) copyDir(internalSrc, path.join(outAssets, 'internal'));

      try {
        const settingsObj = JSON.parse(
          ir.settingsJs.replace(/^[\s\S]*?=\s*/, '').replace(/;?\s*$/, ''),
        );
        const builtins = settingsObj?.engine?.builtinAssets || [];
        if (builtins.length) {
          const c = copyUuidsIntoBundle(ir, 'internal', builtins, outAssets);
          if (c.missing.length) {
            warnings.push(
              `internal builtins missing ${c.missing.length} (first: ${c.missing[0]})`,
            );
          }
        }
      } catch (e) {
        warnings.push(
          `builtinAssets copy skipped: ${e instanceof Error ? e.message : String(e)}`,
        );
      }

      // main config + library files
      ensureDir(path.join(outAssets, 'main'));
      fs.writeFileSync(path.join(outAssets, 'main', 'config.json'), ir.mainConfigJson, 'utf8');
      const mainIndex = path.join(ir.shellCacheRoot, 'assets', 'main', 'index.js');
      if (fs.existsSync(mainIndex)) copyFile(mainIndex, path.join(outAssets, 'main', 'index.js'));
      else fs.writeFileSync(path.join(outAssets, 'main', 'index.js'), bundleIndexJs('main'), 'utf8');

      const mainCfg = JSON.parse(ir.mainConfigJson);
      const mainCopy = copyUuidsIntoBundle(ir, 'main', collectConfigUuids(mainCfg), outAssets);
      if (mainCopy.missing.length) {
        warnings.push(`main missing ${mainCopy.missing.length} uuids (first: ${mainCopy.missing[0]})`);
      }

      // Runtime UUID loads (Kenney prefabs etc.) may not appear in main config —
      // copy the whole project library into main so static dist is self-contained.
      const libExtra = copyEntireLibraryIntoBundle(ir.libraryRoot, path.join(outAssets, 'main'));
      if (libExtra > 0) log(`copied +${libExtra} library files → assets/main`);

      // custom bundles
      for (const b of ir.bundles) {
        ensureDir(path.join(outAssets, b.name));
        fs.writeFileSync(
          path.join(outAssets, b.name, 'config.json'),
          JSON.stringify(b.config),
          'utf8',
        );
        fs.writeFileSync(path.join(outAssets, b.name, 'index.js'), bundleIndexJs(b.name), 'utf8');
        const c = copyUuidsIntoBundle(ir, b.name, collectConfigUuids(b.config), outAssets);
        if (c.missing.length) {
          warnings.push(`${b.name} missing ${c.missing.length} uuids`);
        }
      }

      // Scenes for /scene/<uuid>.json
      if (ir.launchScene) {
        const sceneFiles = libLookup(ir.libraryRoot, ir.internalLibraryRoot, ir.launchScene);
        for (const f of sceneFiles) {
          if (f.endsWith('.json')) {
            copyFile(f, path.join(outDir, 'scene', `${ir.launchScene}.json`));
            copyFile(f, path.join(outDir, 'scene', 'current_scene.json'));
          }
        }
      }

      // Headless boot helpers + remote console + socket.io stub (parity with preview-mirror).
      copyHeadlessRuntime(outDir, files, warnings);

      // Marker
      fs.writeFileSync(
        path.join(outDir, 'kurenai-publish.json'),
        JSON.stringify(
          {
            platform: 'web',
            projectRoot: ir.projectRoot,
            launchScene: ir.launchScene,
            bundles: ir.bundles.map((b) => b.name),
            createdAt: new Date().toISOString(),
          },
          null,
          2,
        ),
        'utf8',
      );

      log(`web publish ok → ${outDir}`);
      return { ok: true, outDir, files, warnings };
    } catch (e) {
      return {
        ok: false,
        outDir,
        files,
        warnings,
        error: e instanceof Error ? e.message : String(e),
      };
    }
  },
};
