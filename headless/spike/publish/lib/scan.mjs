/**
 * Asset scan + bundle/settings synthesis for publish (extracted from preview-mirror semantics).
 */
import fs from 'fs';
import path from 'path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { IMAGE_EXTS } = require('../../importers/image.cjs');
const { AUDIO_EXTS } = require('../../importers/audio.cjs');
const { FONT_EXTS } = require('../../importers/font.cjs');
const { BMFONT_EXTS } = require('../../importers/bmfont.cjs');
const { PLIST_EXTS } = require('../../importers/plist.cjs');
const { TEXT_EXTS } = require('../../importers/text.cjs');

export const JSON_ASSET_TYPES = {
  '.prefab': 'cc.Prefab',
  '.scene': 'cc.SceneAsset',
  '.anim': 'cc.AnimationClip',
  '.animgraph': 'cc.animation.AnimationGraph',
  '.mtl': 'cc.Material',
};

export function collectHeadlessAssets(assetsRoot, rootDir = assetsRoot) {
  const images = [];
  const audios = [];
  const fonts = [];
  const bmfonts = [];
  const spines = [];
  const atlases = [];
  const particles = [];
  const texts = [];
  const jsonAssets = [];
  function walk(dir) {
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const file = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(file);
        continue;
      }
      const ext = path.extname(entry.name).toLowerCase();
      const isImage = IMAGE_EXTS.has(ext);
      const isAudio = AUDIO_EXTS.has(ext);
      const isFont = FONT_EXTS.has(ext);
      const isBMFont = BMFONT_EXTS.has(ext);
      const isPlist = PLIST_EXTS.has(ext);
      const isText = TEXT_EXTS.has(ext);
      const isJsonAsset = ext in JSON_ASSET_TYPES;
      const maybeSpine = ext === '.json' || ext === '.skel';
      if (!isImage && !isAudio && !isFont && !isBMFont && !isPlist && !isText && !isJsonAsset && !maybeSpine) {
        continue;
      }
      try {
        const meta = JSON.parse(fs.readFileSync(`${file}.meta`, 'utf8'));
        if (!meta.uuid) continue;
        const relFromAssets = path.relative(assetsRoot, file).replace(/\\/g, '/');
        const rel = path.relative(rootDir, file).replace(/\\/g, '/').slice(0, -ext.length);
        const dbPath = `db:/assets/${relFromAssets.slice(0, -ext.length)}`;
        if (isPlist) {
          if (meta.importer === 'sprite-atlas') {
            const frames = Object.values(meta.subMetas || {})
              .filter((s) => s && s.uuid && s.importer === 'sprite-frame')
              .map((s) => s.uuid);
            atlases.push({ uuid: meta.uuid, frames, dbPath, rel });
          } else if (meta.importer === 'particle') {
            particles.push({ uuid: meta.uuid, dbPath, rel });
          }
        } else if (isImage) {
          const texture = meta.subMetas?.['6c48a']?.uuid;
          const spriteFrame = meta.subMetas?.['f9941']?.uuid;
          if (!texture || !spriteFrame) continue;
          images.push({ uuid: meta.uuid, texture, spriteFrame, ext, dbPath, rel });
        } else if (isAudio) {
          audios.push({ uuid: meta.uuid, ext, dbPath, rel });
        } else if (isFont) {
          fonts.push({ uuid: meta.uuid, ext, dbPath, rel });
        } else if (isBMFont) {
          if (meta.importer === 'bitmap-font') bmfonts.push({ uuid: meta.uuid, ext, dbPath, rel });
        } else if (isText) {
          texts.push({ uuid: meta.uuid, ext, dbPath, rel });
        } else if (meta.importer === 'spine-data') {
          spines.push({ uuid: meta.uuid, ext, dbPath, rel });
        } else if (isJsonAsset) {
          jsonAssets.push({ uuid: meta.uuid, dbPath, rel, type: JSON_ASSET_TYPES[ext] });
        } else if (ext === '.json' && meta.importer === 'json') {
          jsonAssets.push({ uuid: meta.uuid, dbPath, rel, type: 'cc.JsonAsset' });
        }
      } catch {
        /* skip bad meta */
      }
    }
  }
  walk(rootDir);
  return { images, audios, fonts, bmfonts, spines, atlases, particles, texts, jsonAssets };
}

export function findBundles(assetsRoot) {
  const bundles = new Map();
  const walk = (dir) => {
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const full = path.join(dir, entry.name);
      try {
        const meta = JSON.parse(fs.readFileSync(`${full}.meta`, 'utf8'));
        if (meta.userData?.isBundle) {
          const name = meta.userData.bundleName || entry.name;
          bundles.set(name, {
            root: full,
            dirRel: path.relative(assetsRoot, full).replace(/\\/g, '/'),
          });
        }
      } catch {
        /* ignore */
      }
      walk(full);
    }
  };
  walk(assetsRoot);
  return bundles;
}

export function buildBundleConfig(assetsRoot, name, root) {
  const config = {
    importBase: 'import',
    nativeBase: 'native',
    name,
    deps: [],
    uuids: [],
    paths: {},
    scenes: {},
    packs: {},
    versions: { import: [], native: [] },
    redirect: [],
    debug: true,
    extensionMap: {},
    hasPreloadScript: false,
    dependencyRelationships: {},
  };
  const known = new Set();
  const add = (uuid) => {
    if (!known.has(uuid)) {
      config.uuids.push(uuid);
      known.add(uuid);
    }
  };
  const { images, audios, fonts, bmfonts, spines, atlases, particles, texts, jsonAssets } =
    collectHeadlessAssets(assetsRoot, root);
  for (const image of images) {
    add(image.uuid);
    add(image.texture);
    add(image.spriteFrame);
    config.paths[image.uuid] = [image.rel, 'cc.ImageAsset'];
    config.paths[image.texture] = [`${image.rel}/texture`, 'cc.Texture2D', 1];
    config.paths[image.spriteFrame] = [`${image.rel}/spriteFrame`, 'cc.SpriteFrame', 1];
  }
  for (const a of audios) {
    add(a.uuid);
    config.paths[a.uuid] = [a.rel, 'cc.AudioClip'];
  }
  for (const f of fonts) {
    add(f.uuid);
    config.paths[f.uuid] = [f.rel, 'cc.TTFFont'];
  }
  for (const b of bmfonts) {
    add(b.uuid);
    config.paths[b.uuid] = [b.rel, 'cc.BitmapFont'];
  }
  for (const s of spines) {
    add(s.uuid);
    config.paths[s.uuid] = [s.rel, 'sp.SkeletonData'];
  }
  for (const atlas of atlases) {
    add(atlas.uuid);
    config.paths[atlas.uuid] = [atlas.rel, 'cc.SpriteAtlas'];
    for (const frameUuid of atlas.frames) {
      add(frameUuid);
      config.paths[frameUuid] = [atlas.rel, 'cc.SpriteFrame', 1];
    }
  }
  for (const p of particles) {
    add(p.uuid);
    config.paths[p.uuid] = [p.rel, 'cc.ParticleAsset'];
  }
  for (const t of texts) {
    add(t.uuid);
    config.paths[t.uuid] = [t.rel, 'cc.TextAsset'];
  }
  for (const j of jsonAssets) {
    add(j.uuid);
    config.paths[j.uuid] = [j.rel, j.type];
    if (j.type === 'cc.SceneAsset') {
      const sceneRel = path.relative(assetsRoot, root).replace(/\\/g, '/');
      config.scenes[`db://assets/${sceneRel}/${j.rel}.scene`] = j.uuid;
    }
  }
  return config;
}

export function bundleIndexJs(name) {
  return `System.register("virtual:///prerequisite-imports/${name}", [], function () {
  "use strict";
  return { setters: [], execute: function () {} };
});
`;
}

export function resolveLaunchSceneUuid(projectRoot, forced = process.env.LAUNCH_SCENE) {
  if (forced) {
    if (/^[0-9a-fA-F-]{36}$/.test(forced)) return forced;
  }
  const assets = path.join(projectRoot, 'assets');
  try {
    const walk = (dir) => {
      for (const name of fs.readdirSync(dir)) {
        const full = path.join(dir, name);
        const st = fs.statSync(full);
        if (st.isDirectory()) {
          const hit = walk(full);
          if (hit) return hit;
        } else if (name.endsWith('.scene.meta')) {
          if (forced && !full.toLowerCase().includes(String(forced).toLowerCase())) continue;
          const uuid = JSON.parse(fs.readFileSync(full, 'utf8')).uuid;
          if (/^[0-9a-fA-F-]{36}$/.test(uuid)) return uuid;
        }
      }
      return null;
    };
    return walk(assets);
  } catch {
    return null;
  }
}

export function readProjectSettings(projectRoot) {
  const out = {};
  try {
    const eng = JSON.parse(
      fs.readFileSync(path.join(projectRoot, 'settings/v2/packages/engine.json'), 'utf8'),
    );
    const walk = (o) => {
      if (!o || typeof o !== 'object') return;
      if (Array.isArray(o.includeModules) && !out.includeModules) out.includeModules = o.includeModules;
      if (o['render-pipeline']?._option && !out.renderPipelineOption) {
        out.renderPipelineOption = o['render-pipeline']._option;
      }
      for (const v of Object.values(o)) if (v && typeof v === 'object') walk(v);
    };
    walk(eng);
    if (eng.macroConfig) out.macros = eng.macroConfig;
  } catch {
    /* optional */
  }
  try {
    const proj = JSON.parse(
      fs.readFileSync(path.join(projectRoot, 'settings/v2/packages/project.json'), 'utf8'),
    );
    if (proj.general?.designResolution) out.designResolution = proj.general.designResolution;
    if (Array.isArray(proj.layer)) out.layers = proj.layer;
  } catch {
    /* optional */
  }
  return out;
}

export function rewriteSettingsJs(js, projectRoot, assetsRoot) {
  const m = js.match(/^(window\._CCSettings\s*=\s*)([\s\S]*?);?\s*$/);
  let settings = null;
  let prefix = 'window._CCSettings = ';
  if (m) {
    try {
      settings = JSON.parse(m[2]);
      prefix = m[1];
    } catch {
      /* fall through */
    }
  }
  if (!settings) {
    const uuid = resolveLaunchSceneUuid(projectRoot);
    if (!uuid) return js;
    return js
      .replace(/"launchScene"\s*:\s*""/, `"launchScene":"${uuid}"`)
      .replace(/"launchScene"\s*:\s*"current_scene"/, `"launchScene":"${uuid}"`);
  }

  const uuid = resolveLaunchSceneUuid(projectRoot);
  if (uuid) settings.launch = { ...settings.launch, launchScene: uuid };

  const ps = readProjectSettings(projectRoot);
  if (ps.includeModules) {
    settings.engine.engineModules = ps.includeModules.slice();
    if (
      ps.renderPipelineOption === 'custom-pipeline' &&
      !settings.engine.engineModules.includes('custom-pipeline-builtin-scripts')
    ) {
      settings.engine.engineModules.push('custom-pipeline-builtin-scripts');
    }
  }
  if (ps.renderPipelineOption) {
    settings.rendering = {
      ...settings.rendering,
      renderPipeline: '',
      customPipeline: ps.renderPipelineOption === 'custom-pipeline',
    };
  }
  if (ps.macros) settings.engine.macros = { ...settings.engine.macros, ...ps.macros };
  if (ps.designResolution) {
    const d = ps.designResolution;
    const policy = d.fitWidth && d.fitHeight ? 2 : d.fitHeight ? 3 : d.fitWidth ? 4 : 1;
    settings.screen = {
      ...settings.screen,
      designResolution: { width: d.width, height: d.height, policy },
    };
  }
  if (ps.layers) {
    settings.engine.customLayers = ps.layers
      .filter((l) => l && l.name && Number.isInteger(Math.log2(l.value)))
      .map((l) => ({ name: l.name, bit: Math.log2(l.value) }));
  }
  const bundles = [...findBundles(assetsRoot).keys()];
  if (bundles.length) {
    settings.assets ||= {};
    const known = new Set(settings.assets.projectBundles || []);
    for (const b of bundles) if (!known.has(b)) (settings.assets.projectBundles ||= []).push(b);
    if (bundles.includes('resources')) {
      settings.assets.preloadBundles ||= [];
      if (!settings.assets.preloadBundles.some((e) => e && e.bundle === 'resources')) {
        settings.assets.preloadBundles.push({ bundle: 'resources' });
      }
    }
  }
  return prefix + JSON.stringify(settings) + ';';
}

export function rewriteMainConfigJson(json, assetsRoot) {
  let config;
  try {
    config = JSON.parse(json);
  } catch {
    return json;
  }
  config.uuids ||= [];
  config.paths ||= {};
  config.extensionMap ||= {};
  const known = new Set(config.uuids);
  const add = (uuid) => {
    if (!known.has(uuid)) {
      config.uuids.push(uuid);
      known.add(uuid);
    }
  };
  const { images, audios, fonts, bmfonts, spines, atlases, particles, texts, jsonAssets } =
    collectHeadlessAssets(assetsRoot);
  for (const image of images) {
    add(image.uuid);
    add(image.texture);
    add(image.spriteFrame);
    config.paths[image.uuid] = [image.dbPath, 'cc.ImageAsset'];
    config.paths[image.texture] = [image.dbPath, 'cc.Texture2D', 1];
    config.paths[image.spriteFrame] = [image.dbPath, 'cc.SpriteFrame', 1];
  }
  for (const audio of audios) {
    add(audio.uuid);
    config.paths[audio.uuid] = [audio.dbPath, 'cc.AudioClip'];
  }
  for (const font of fonts) {
    add(font.uuid);
    config.paths[font.uuid] = [font.dbPath, 'cc.TTFFont'];
  }
  for (const bmfont of bmfonts) {
    add(bmfont.uuid);
    config.paths[bmfont.uuid] = [bmfont.dbPath, 'cc.BitmapFont'];
  }
  for (const spine of spines) {
    add(spine.uuid);
    config.paths[spine.uuid] = [spine.dbPath, 'sp.SkeletonData'];
  }
  for (const atlas of atlases) {
    add(atlas.uuid);
    config.paths[atlas.uuid] = [atlas.dbPath, 'cc.SpriteAtlas'];
    for (const frameUuid of atlas.frames) {
      add(frameUuid);
      config.paths[frameUuid] = [atlas.dbPath, 'cc.SpriteFrame', 1];
    }
  }
  for (const particle of particles) {
    add(particle.uuid);
    config.paths[particle.uuid] = [particle.dbPath, 'cc.ParticleAsset'];
  }
  for (const text of texts) {
    add(text.uuid);
    config.paths[text.uuid] = [text.dbPath, 'cc.TextAsset'];
  }
  for (const j of jsonAssets) {
    add(j.uuid);
    config.paths[j.uuid] = [j.dbPath, j.type];
    if (j.type === 'cc.SceneAsset') {
      config.scenes ||= {};
      config.scenes[`db://assets/${j.rel}.scene`] = j.uuid;
    }
  }
  return JSON.stringify(config);
}

/** Copy scene/prefab/anim JSON sources into library/<shard>/<uuid>.json when missing. */
export function syncJsonAssetsToLibrary(assetsRoot, libraryRoot) {
  let synced = 0;
  const walk = (dir) => {
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
        continue;
      }
      const ext = path.extname(entry.name).toLowerCase();
      if (!(ext in JSON_ASSET_TYPES)) continue;
      const metaPath = `${full}.meta`;
      if (!fs.existsSync(metaPath)) continue;
      try {
        const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
        if (!meta.uuid || !/^[0-9a-fA-F-]{36}$/.test(meta.uuid)) continue;
        const destDir = path.join(libraryRoot, meta.uuid.slice(0, 2));
        fs.mkdirSync(destDir, { recursive: true });
        const dest = path.join(destDir, `${meta.uuid}.json`);
        fs.copyFileSync(full, dest);
        synced++;
      } catch {
        /* skip */
      }
    }
  };
  walk(assetsRoot);
  return synced;
}
