import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import { resolveEngineSnapshot, kitMissingHelp } from '../../engine-snapshot-path.mjs';
import {
  findBundles,
  buildBundleConfig,
  resolveLaunchSceneUuid,
  rewriteSettingsJs,
  rewriteMainConfigJson,
  syncJsonAssetsToLibrary,
} from './scan.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SPIKE = path.resolve(__dirname, '../..');
const CACHE = path.join(SPIKE, 'cache');
const PACKER_SCRIPT = path.join(SPIKE, 'packer', 'build.cjs');

function normalize(p) {
  const r = path.resolve(p);
  return /^[a-z]:/.test(r) ? r[0].toUpperCase() + r.slice(1) : r;
}

function runNode(script, args, cwd) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(process.execPath, [script, ...args], {
      cwd,
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
      env: process.env,
    });
    let out = '';
    let err = '';
    child.stdout.on('data', (d) => {
      out += d;
    });
    child.stderr.on('data', (d) => {
      err += d;
    });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) resolvePromise({ out, err });
      else reject(new Error(`packer exit ${code}\n${err || out}`));
    });
  });
}

/**
 * @param {{ projectRoot: string, skipPacker?: boolean, packerOut?: string }} opts
 * @returns {Promise<import('../platforms/types.mjs').PublishIR>}
 */
export async function buildPublishIR(opts) {
  const projectRoot = normalize(opts.projectRoot);
  const assetsRoot = path.join(projectRoot, 'assets');
  const libraryRoot = path.join(projectRoot, 'library');
  fs.mkdirSync(libraryRoot, { recursive: true });
  const syncedJson = syncJsonAssetsToLibrary(assetsRoot, libraryRoot);
  const engineKit = resolveEngineSnapshot();
  if (!engineKit) throw new Error(kitMissingHelp());

  const packerOut = normalize(
    opts.packerOut ||
      path.join(projectRoot, 'temp/programming/packer-driver/targets/build'),
  );

  let packerLog = `syncedJson=${syncedJson}`;
  if (!opts.skipPacker) {
    const result = await runNode(
      PACKER_SCRIPT,
      [`--project=${projectRoot}`, `--out=${packerOut}`],
      SPIKE,
    );
    packerLog += '\n' + ((result.out || '') + (result.err || ''));
  } else if (!fs.existsSync(packerOut)) {
    const previewMini = path.join(
      projectRoot,
      'temp/programming/packer-driver/targets/preview-mini',
    );
    const preview = path.join(
      projectRoot,
      'temp/programming/packer-driver/targets/preview',
    );
    if (fs.existsSync(previewMini)) {
      fs.cpSync(previewMini, packerOut, { recursive: true });
    } else if (fs.existsSync(preview)) {
      fs.cpSync(preview, packerOut, { recursive: true });
    } else {
      throw new Error('No packer output; run without skipPacker or preview once');
    }
  }

  if (!fs.existsSync(CACHE)) {
    throw new Error(`Missing preview shell cache at ${CACHE}`);
  }

  const settingsSrc = fs.readFileSync(path.join(CACHE, 'settings.js'), 'utf8');
  const settingsJs = rewriteSettingsJs(settingsSrc, projectRoot, assetsRoot);

  const mainCached = path.join(CACHE, 'assets', 'main', 'config.json');
  const mainConfig = fs.existsSync(mainCached)
    ? rewriteMainConfigJson(fs.readFileSync(mainCached, 'utf8'), assetsRoot)
    : rewriteMainConfigJson('{"uuids":[],"paths":{},"scenes":{}}', assetsRoot);

  const bundleMap = findBundles(assetsRoot);
  const bundles = [];
  for (const [name, info] of bundleMap) {
    bundles.push({
      name,
      root: info.root,
      dirRel: info.dirRel,
      config: buildBundleConfig(assetsRoot, name, info.root),
    });
  }

  const launchScene = resolveLaunchSceneUuid(projectRoot);

  return {
    version: 1,
    projectRoot,
    assetsRoot,
    libraryRoot,
    internalLibraryRoot: path.join(engineKit, 'internal-library'),
    engineKit,
    enginePreviewRoot: path.join(engineKit, 'preview'),
    engineNativeExternal: path.join(engineKit, 'native-external'),
    shellCacheRoot: CACHE,
    scriptsRoot: packerOut,
    settingsJs,
    mainConfigJson: mainConfig,
    bundles,
    launchScene,
    meta: {
      createdAt: new Date().toISOString(),
      packerLog: packerLog.trim().slice(-2000),
    },
  };
}
