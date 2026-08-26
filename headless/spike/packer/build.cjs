#!/usr/bin/env node
'use strict';
/**
 * Mini-packer: build Cocos Creator user scripts into packer-driver-compatible
 * chunks WITHOUT running Creator IDE.
 *
 * Usage:
 *   node build.cjs [--project=<dir>] [--out=<dir>] [--npm=<node_modules>]
 *                  [--project-url=<url>] [--verbose]
 *
 * Defaults:
 *   --project      d:/tempWorkspace/baseAIAutoCocos
 *   --out          <project>/temp/programming/packer-driver/targets/preview-mini
 *   --npm          d:/tempWorkspace/headless-cocos-research/tmp-asar-root/node_modules
 *                  (must contain @cocos/creator-programming-{quick-pack,mod-lo,...})
 *   --project-url  (env PROJECT_URL) fake file:// URL used for module identity.
 *                  If set, chunks are hashed from this URL prefix instead of the
 *                  real disk path. Required for Docker/Linux runs when the same
 *                  project is _also_ compiled by a Windows Creator run and both
 *                  outputs need to share `import-map.json` (chunk hashes are
 *                  path-sensitive, e.g. file:///D:/… vs file:///workspace/…).
 *                  Example: PROJECT_URL='file:///D:/tempWorkspace/baseAIAutoCocos'
 *
 * See docs/headless-cocos-final.md for architecture.
 */

const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');

function parseArgs(argv) {
  const out = {};
  for (const a of argv.slice(2)) {
    const m = a.match(/^--([^=]+)(=(.*))?$/);
    if (!m) continue;
    out[m[1]] = m[3] === undefined ? true : m[3];
  }
  return out;
}

const args = parseArgs(process.argv);

// Windows: normalize drive letter to uppercase so pathToFileURL()-derived
// chunk hashes are stable regardless of how the path was spelled at CLI.
function normalize(p) {
  const r = path.resolve(p);
  return /^[a-z]:/.test(r) ? r[0].toUpperCase() + r.slice(1) : r;
}

const PROJECT = normalize(args.project || process.env.PROJECT || 'D:/tempWorkspace/baseAIAutoCocos');
const NPM_ROOT = normalize(
  args.npm ||
  process.env.NPM_ROOT ||
  'D:/tempWorkspace/headless-cocos-research/tmp-asar-root/node_modules'
);
const ASSETS = path.join(PROJECT, 'assets');
const OUT = normalize(
  args.out ||
  process.env.OUT ||
  path.join(PROJECT, 'temp/programming/packer-driver/targets/preview-mini')
);
const VERBOSE = !!(args.verbose || process.env.VERBOSE);
// If PROJECT_URL is set, module URLs (and thus chunk hashes) are derived from
// this prefix instead of pathToFileURL(realDiskPath). Source is still loaded
// from disk via ModLo.addMemoryModule() so the fake URL doesn't need to be
// resolvable by fs. Trailing slash normalized off.
const PROJECT_URL = ((args['project-url'] || process.env.PROJECT_URL || '') + '').replace(/\/+$/, '');

// --- Resolve deps ---
function reqCoc(rel) {
  return require(path.join(NPM_ROOT, rel));
}
const { QuickPack } = reqCoc('@cocos/creator-programming-quick-pack/lib/quick-pack');
const { ModLo } = reqCoc('@cocos/creator-programming-mod-lo/lib/mod-lo');

// Swap mod-lo's plugin-detect-circular for our context-safe re-implementation
// (the original crashes with "Couldn't find a Program" when invoked outside
// Creator's babel runtime — it standalone-traverses without a scope).
{
  const crPluginExports = reqCoc(
    '@cocos/creator-programming-mod-lo/lib/transformer/babel/babel-plugins/plugin-detect-circular',
  );
  const pluginCr = require('./plugin-cr.cjs');
  crPluginExports.default = pluginCr;
  crPluginExports.$ = pluginCr;
}

// Circular-reference reporter module. Creator injects this as a virtual module
// (cce:/internal/code-quality/cr.mjs) and enables the detect-circular babel
// plugin via ModLo's `cr` option. Without it, chunks lack the `_crd` guards
// and modules involved in import cycles hard-fail (e.g. `X is not a function`
// when a decorator is used before its module executed) instead of matching
// Creator preview behaviour.
const CR_MODULE_URL = 'cce:/internal/code-quality/cr.mjs';
const CR_MODULE_SOURCE = `/**
 * This is the module which implements circular-reference detection.
 */

/**
 * Reports a circular reference error fired by module import.
 * @param imported The binding of the import.
 * @param moduleRequest The module request of the import.
 * @param importMeta The import.meta of the source module.
 * @param extras Extra data passed by circular reference detection implementation.
 */
export function report(imported, moduleRequest, importMeta, extras) {
    console.warn(\`Found possible circular reference in "\${importMeta.url}", happened when use "\${imported}" imported from "\${moduleRequest}" \`, extras.error);
}
`;

// Creator's uuid utility (compressUUID); path relative to asar extract layout
const UUID_UTIL_PATH = args['uuid-util']
  || process.env.UUID_UTIL
  || path.resolve(NPM_ROOT, '../utils/dist/uuid.js');
const uuidUtils = require(UUID_UTIL_PATH);

// --- Logger ---
const logger = {
  debug: (m) => VERBOSE && console.log('[dbg]', m),
  info: (m) => console.log('[inf]', m),
  warn: (m) => console.warn('[wrn]', m),
  error: (m) => console.error('[err]', m),
};

// --- Helpers ---
async function collectScripts(root) {
  const out = [];
  async function walk(dir) {
    let entries;
    try {
      entries = await fs.promises.readdir(dir, { withFileTypes: true });
    } catch { return; }
    for (const e of entries) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) await walk(p);
      else if (/\.(ts|js)$/i.test(e.name) && !/\.d\.ts$/i.test(e.name)) out.push(p);
    }
  }
  await walk(root);
  return out;
}

// Compute the module URL for a real disk path. When PROJECT_URL is set, the
// URL is derived by substituting the project root, so `file:///D:/proj/assets/
// x.ts` stays stable even when the mini-packer runs inside a Linux container
// where the disk path is `/workspace/assets/x.ts`.
function moduleUrlFor(realAbsPath) {
  if (!PROJECT_URL) return pathToFileURL(realAbsPath).href;
  let rel = path.relative(PROJECT, realAbsPath);
  if (rel.startsWith('..')) return pathToFileURL(realAbsPath).href; // outside project — keep real
  rel = rel.replace(/\\/g, '/');
  return PROJECT_URL + '/' + rel;
}

async function readUuidMap(files) {
  const map = new Map();
  await Promise.all(files.map(async (f) => {
    try {
      const meta = JSON.parse(await fs.promises.readFile(f + '.meta', 'utf8'));
      if (meta && meta.uuid) map.set(moduleUrlFor(f), meta.uuid);
    } catch {}
  }));
  return map;
}

async function build() {
  await fs.promises.mkdir(OUT, { recursive: true });

  const modLo = new ModLo({
    transformer: 'babel',
    targets: 'chrome 100',
    loose: true,
    useDefineForClassFields: false,
    allowDeclareFields: true,
    guessCommonJsExports: true,
    _importMetaURLValid: true,
    _compressUUID: (u) => uuidUtils.compressUUID(u),
    checkObsolete: true,
    hot: true,
    cr: {
      // Engine imports never form cycles with user code — Creator's own chunks
      // guard only project-relative imports, so filter cc/cc-env/db requests.
      moduleRequestFilter: [/^cc(\/.+)?$/, /^db:\/\//],
      reporter: {
        moduleName: CR_MODULE_URL,
        functionName: 'report',
      },
    },
    // When PROJECT_URL is set the URLs are Windows-style (file:///D:/…) and
    // the container reaches them via a symlink (see Dockerfile). Preserve
    // symlinks so mod-lo doesn't rewrite URLs back to the /workspace form
    // — that would break chunk-hash parity with Creator's import-map.
    preserveSymlinks: !!PROJECT_URL,
    logger,
  });
  modLo.setExternals(['cc']);
  modLo.addMemoryModule(CR_MODULE_URL, CR_MODULE_SOURCE);
  // assetsPrefix is a URL prefix; PROJECT_URL takes precedence so mod-lo's
  // assetPrefix-based logic (URL identity, subpath handling) sees the same
  // world as chunk hashing.
  const assetsPrefix = (PROJECT_URL ? (PROJECT_URL + '/assets') : pathToFileURL(ASSETS).href) + '/';
  modLo.setAssetPrefixes([assetsPrefix]);

  const files = await collectScripts(ASSETS);
  const uuidMap = await readUuidMap(files);
  for (const [url, uuid] of uuidMap) modLo.setUUID(url, uuid);

  const packer = new QuickPack({
    modLo,
    origin: assetsPrefix,
    workspace: OUT,
    sourceMaps: true,
    logger,
  });

  const entries = files.map((f) => moduleUrlFor(f));
  const t0 = Date.now();
  const res = await packer.build(entries);
  const dt = Date.now() - t0;
  return {
    ms: dt,
    scripts: files.length,
    scriptsWithUuid: uuidMap.size,
    depsGraphSize: Object.keys(res.depsGraph).length,
  };
}

async function main() {
  if (VERBOSE) {
    console.log('project    :', PROJECT);
    console.log('out        :', OUT);
    console.log('npm        :', NPM_ROOT);
    if (PROJECT_URL) console.log('project-url:', PROJECT_URL);
  }
  const info = await build();
  console.log(`[mini-packer] built ${info.scripts} script(s) (uuid:${info.scriptsWithUuid}) in ${info.ms}ms deps=${info.depsGraphSize} → ${OUT}`);
}

if (require.main === module) {
  main().catch((e) => {
    console.error('[mini-packer] BUILD FAILED');
    console.error(e && e.stack || e);
    process.exit(1);
  });
}

module.exports = { build };
