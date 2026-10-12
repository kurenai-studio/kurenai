import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from "node:path";

/** Bundle config preset this package owns in the project's builder settings. */
export const SUBPACKAGE_CONFIG_ID = "kurenai_wechat_subpackage";

/**
 * WeChat builds the bundle as a mini-game subpackage; every other platform keeps the
 * default merge_dep bundle. `overwrite` mode means "use overwriteSettings[platform], else merge_dep".
 */
export const SUBPACKAGE_BUNDLE_CONFIG = {
  displayName: "WeChat subpackage (kurenai-wechat)",
  configs: {
    native: { preferredOptions: { isRemote: false, compressionType: "merge_dep" } },
    web: {
      preferredOptions: { isRemote: false, compressionType: "merge_dep" },
      fallbackOptions: { compressionType: "merge_dep" },
    },
    miniGame: {
      configMode: "overwrite",
      overwriteSettings: { wechatgame: { isRemote: false, compressionType: "subpackage" } },
    },
  },
} as const;

export type CreatorLine = "3.8" | "4";

export type SubpackageResult = {
  project: string;
  creator: CreatorLine;
  settingsFile: string;
  bundles: Array<{ folder: string; bundleName: string; metaCreated: boolean }>;
};

type Json = Record<string, unknown>;

function readJson(file: string): Json {
  return JSON.parse(readFileSync(file, "utf8")) as Json;
}

function writeJson(file: string, value: unknown): void {
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

function asObject(value: unknown): Json {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Json) : {};
}

export function detectCreatorLine(project: string): CreatorLine {
  const pkgFile = join(project, "package.json");
  if (!existsSync(pkgFile)) throw new Error(`Not a Cocos Creator project (no package.json): ${project}`);
  const version = String(asObject(readJson(pkgFile).creator).version ?? "");
  if (version.startsWith("3.")) return "3.8";
  if (version.startsWith("4.")) return "4";
  throw new Error(`Unsupported Creator version "${version}" in ${pkgFile} (expected 3.8.x or 4.x)`);
}

/** Creator 4 keeps project builder settings in settings/cocos.config.json; 3.8 in settings/v2/packages/builder.json. */
function builderSettings(project: string, creator: CreatorLine) {
  if (creator === "4") {
    const file = join(project, "settings", "cocos.config.json");
    const root = existsSync(file) ? readJson(file) : {};
    const builder = asObject(root.builder);
    root.builder = builder;
    return { file, root, builder };
  }
  const file = join(project, "settings", "v2", "packages", "builder.json");
  // Creator migrates unversioned settings files from scratch; 1.3.9 is the 3.8.8 builder.
  const root = existsSync(file) ? readJson(file) : { __version__: "1.3.9" };
  return { file, root, builder: root };
}

function bundleNameFor(folder: string): string {
  const name = basename(folder).replace(/[^A-Za-z0-9_-]/g, "_");
  if (!name) throw new Error(`Cannot derive a bundle name from ${folder}`);
  return name;
}

function resolveFolder(project: string, folder: string): string {
  const absolute = isAbsolute(folder) ? folder : resolve(project, folder);
  const rel = relative(join(project, "assets"), absolute);
  if (!rel || rel.startsWith("..") || isAbsolute(rel)) {
    throw new Error(`Subpackage folder must be inside ${join(project, "assets")}: ${folder}`);
  }
  if (!existsSync(absolute) || !statSync(absolute).isDirectory()) {
    throw new Error(`Subpackage folder does not exist: ${absolute}`);
  }
  return absolute;
}

/**
 * Turn asset folders into Asset Bundles that WeChat builds as subpackages
 * (output under `subpackages/<bundleName>/`, listed in game.json). Idempotent.
 */
export function configureSubpackages(
  projectDir: string,
  folders: string[],
  options: { priority?: number } = {},
): SubpackageResult {
  if (!folders.length) throw new Error("Pass at least one asset folder to turn into a subpackage");
  const project = resolve(projectDir);
  const creator = detectCreatorLine(project);
  const settings = builderSettings(project, creator);
  const bundleConfig = asObject(settings.builder.bundleConfig);
  const custom = asObject(bundleConfig.custom);
  custom[SUBPACKAGE_CONFIG_ID] = SUBPACKAGE_BUNDLE_CONFIG;
  bundleConfig.custom = custom;
  settings.builder.bundleConfig = bundleConfig;

  const names = new Set<string>();
  const bundles = folders.map((folder) => {
    const absolute = resolveFolder(project, folder);
    const metaFile = `${absolute}.meta`;
    const metaCreated = !existsSync(metaFile);
    const meta = metaCreated
      ? { ver: "1.2.0", importer: "directory", imported: true, uuid: randomUUID(), files: [], subMetas: {}, userData: {} }
      : readJson(metaFile);
    const userData = asObject(meta.userData);
    const bundleName = typeof userData.bundleName === "string" && userData.bundleName
      ? userData.bundleName
      : bundleNameFor(absolute);
    if (names.has(bundleName)) throw new Error(`Two folders map to the same bundle name: ${bundleName}`);
    names.add(bundleName);
    meta.userData = {
      ...userData,
      isBundle: true,
      bundleConfigID: SUBPACKAGE_CONFIG_ID,
      bundleName,
      priority: typeof userData.priority === "number" ? userData.priority : options.priority ?? 1,
    };
    writeJson(metaFile, meta);
    return { folder: relative(project, absolute).split(sep).join("/"), bundleName, metaCreated };
  });

  writeJson(settings.file, settings.root);
  return { project, creator, settingsFile: settings.file, bundles };
}

/** Undo configureSubpackages for the given folders (the bundle preset stays in settings). */
export function removeSubpackages(projectDir: string, folders: string[]): string[] {
  const project = resolve(projectDir);
  const changed: string[] = [];
  for (const folder of folders) {
    const metaFile = `${resolveFolder(project, folder)}.meta`;
    if (!existsSync(metaFile)) continue;
    const meta = readJson(metaFile);
    const userData = asObject(meta.userData);
    if (userData.bundleConfigID !== SUBPACKAGE_CONFIG_ID) continue;
    const { isBundle: _isBundle, bundleConfigID: _id, bundleName: _name, priority: _priority, ...rest } = userData;
    meta.userData = rest;
    writeJson(metaFile, meta);
    changed.push(relative(project, metaFile).split(sep).join("/"));
  }
  return changed;
}
