import { spawn } from "node:child_process";
import { createWriteStream, existsSync, mkdirSync, readFileSync } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import { get as httpGet, type IncomingMessage } from "node:http";
import { get as httpsGet } from "node:https";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { pipeline } from "node:stream/promises";
import { loadAddon, type NpmAddon } from "./addons.js";
import {
  KURENAI_COCOS_CORE_VERSION,
  bundledCocosCoreRoot,
  packageFile,
  resolveCocosCliRoot,
} from "./paths.js";

export type PackId = string;

export type PackPresence = {
  id: PackId;
  present: boolean;
  paths: string[];
  missingPaths: string[];
};

export type PacksStatus = {
  root: string;
  layout: "missing" | "core-or-full" | "unknown";
  packs: PackPresence[];
  hasNative: boolean;
  platformPacksPresent: string[];
};

export type EnsurePacksResult = {
  root: string;
  required: PackId[];
  alreadyPresent: PackId[];
  installed: PackId[];
  missing: PackId[];
};

type Manifest = {
  measuredAgainst?: { engineVersion?: string; cocosCliPackageVersion?: string };
  packs: {
    core: { id: string; include: string[]; exclude: string[] };
    build: { id: string; probes: string[] };
    platform: {
      packs: Array<{ id: string; dir: string; builderIdHint?: string; npm?: NpmAddon }>;
    };
    native: {
      shared: Array<{ id: string; paths: string[] }>;
      targets: Array<{ id: string; paths: string[] }>;
    };
    platformTools: {
      packs: Array<{ id: string; paths: string[] }>;
    };
  };
  kurenaiHooks?: {
    webDefault?: string[];
    publishWeb?: string[];
    publishWechat?: string[];
    publishAndroid?: string[];
  };
};

let cachedManifest: Manifest | undefined;

function loadManifest(): Manifest {
  if (cachedManifest) return cachedManifest;
  const path = packageFile("docs/cocos-cli-split.manifest.json");
  cachedManifest = JSON.parse(readFileSync(path, "utf8")) as Manifest;
  return cachedManifest;
}

/** Exported for tests that need to inject a manifest without touching disk layout. */
export function _resetPackManifestCacheForTests(): void {
  cachedManifest = undefined;
}

function stripGlob(path: string): string {
  return path.replace(/\/\*\*$/, "");
}

function probePathsForPack(manifest: Manifest, id: PackId): string[] {
  if (id === "core") {
    // Slim vendor drops dist/cli.js (kurenai drives the host directly). Probe the
    // launcher the host loads instead.
    return ["dist/core/launcher.js"];
  }
  if (id === manifest.packs.build.id) return manifest.packs.build.probes;
  const platform = manifest.packs.platform.packs.find((pack) => pack.id === id);
  if (platform) return [join(platform.dir, "package.json")];

  const native = [...manifest.packs.native.shared, ...manifest.packs.native.targets].find(
    (pack) => pack.id === id,
  );
  if (native) return native.paths;

  const tool = manifest.packs.platformTools.packs.find((pack) => pack.id === id);
  if (tool) return tool.paths;

  throw new Error(`Unknown cocos pack id: ${id}`);
}

export function listKnownPackIds(root?: string): PackId[] {
  void root;
  const manifest = loadManifest();
  return [
    "core",
    manifest.packs.build.id,
    ...manifest.packs.platform.packs.map((pack) => pack.id),
    ...manifest.packs.native.shared.map((pack) => pack.id),
    ...manifest.packs.native.targets.map((pack) => pack.id),
    ...manifest.packs.platformTools.packs.map((pack) => pack.id),
  ];
}

/**
 * Map a cocos/kurenai build platform to the packs that must be present.
 * Every build needs core + the core build pack; mini-game / native add their own packs.
 */
export function packsForPlatform(platform: string): PackId[] {
  const build = loadManifest().packs.build.id;
  const packs = platformPacks(platform.trim().toLowerCase());
  return packs.includes(build) ? packs : ["core", build, ...packs.filter((id) => id !== "core")];
}

function platformPacks(normalized: string): PackId[] {
  const manifest = loadManifest();

  if (normalized === "web-desktop" || normalized === "web-mobile" || normalized === "web") {
    return manifest.kurenaiHooks?.publishWeb ?? ["core"];
  }

  const byHint = manifest.packs.platform.packs.find(
    (pack) =>
      pack.builderIdHint?.toLowerCase() === normalized ||
      pack.id === `platform:${normalized}` ||
      pack.dir.endsWith(`/${normalized}`),
  );
  if (byHint) return ["core", byHint.id];

  // Common aliases
  if (normalized === "wechatgame" || normalized === "wechat") {
    return manifest.kurenaiHooks?.publishWechat ?? ["core", "platform:wechat"];
  }
  if (normalized === "bytedance-mini-game" || normalized === "bytedance") {
    return ["core", "platform:bytedance"];
  }
  if (normalized === "alipay-mini-game" || normalized === "alipay") {
    return ["core", "platform:alipay"];
  }
  if (normalized === "fb-instant-games" || normalized === "meta") {
    return ["core", "platform:meta"];
  }

  if (
    normalized === "android" ||
    normalized === "google-play" ||
    normalized === "huawei-agc"
  ) {
    return manifest.kurenaiHooks?.publishAndroid ?? [
      "core",
      "native:engine-src",
      "native:tool-cmake",
      "native:android",
    ];
  }
  if (normalized === "ios") {
    return ["core", "native:engine-src", "native:tool-cmake", "native:ios"];
  }
  if (normalized === "mac" || normalized === "osx") {
    return ["core", "native:engine-src", "native:tool-cmake", "native:mac"];
  }
  if (normalized === "windows" || normalized === "win64") {
    return ["core", "native:engine-src", "native:tool-cmake", "native:win64"];
  }
  if (normalized === "ohos" || normalized === "harmonyos-next" || normalized === "openharmony") {
    return ["core", "native:engine-src", "native:tool-cmake", "native:ohos"];
  }
  if (normalized === "linux") {
    return ["core", "native:engine-src", "native:tool-cmake", "native:linux"];
  }

  // Unknown platform: require core; cocos-cli will still validate the id.
  return ["core"];
}

export function inspectPack(
  id: PackId,
  configuredRoot?: string,
): PackPresence {
  const root = resolveCocosCliRoot(configuredRoot);
  const paths = probePathsForPack(loadManifest(), id);
  const missingPaths = paths.filter((relative) => !existsSync(join(root, relative)));
  return {
    id,
    present: missingPaths.length === 0,
    paths,
    missingPaths,
  };
}

export function packsStatus(configuredRoot?: string): PacksStatus {
  const root = resolveCocosCliRoot(configuredRoot);
  const manifest = loadManifest();
  const ids = listKnownPackIds();
  const packs = ids.map((id) => inspectPack(id, root));
  const hasLauncher = existsSync(join(root, "dist/core/launcher.js"));
  const hasNative = existsSync(join(root, "packages/engine/native"));
  const platformPacksPresent = manifest.packs.platform.packs
    .map((pack) => pack.id)
    .filter((id) => inspectPack(id, root).present);

  return {
    root,
    layout: !existsSync(root)
      ? "missing"
      : hasLauncher
        ? "core-or-full"
        : "unknown",
    packs,
    hasNative,
    platformPacksPresent,
  };
}

/** Platform packs that come from an npm package (plugin + publishing tools) instead of a tgz. */
export function packAddon(id: PackId): NpmAddon | undefined {
  return loadManifest().packs.platform.packs.find((pack) => pack.id === id)?.npm;
}

/** The npm addon behind a build platform's pack, e.g. wechatgame → @kurenai-studio/wechat-minigame. */
export function platformAddon(platform: string): NpmAddon | undefined {
  const id = packsForPlatform(platform).find((pack) => pack.startsWith("platform:"));
  return id ? packAddon(id) : undefined;
}

function packDownloadUrl(packId: PackId, baseUrl: string, version: string): string {
  const base = baseUrl.replace(/\/$/, "");
  // e.g. https://cdn.example/cocos-packs/4.0.0-alpha.33/core.tgz
  const slug = packId.replaceAll(":", "/");
  return `${base}/${version}/${slug}.tgz`;
}

function resolvePackBaseUrl(options: EnsurePacksOptions): string | undefined {
  return (
    options.baseUrl ||
    process.env.KURENAI_COCOS_PACK_BASE_URL ||
    process.env.KURENAI_DEFAULT_COCOS_PACK_BASE_URL ||
    undefined
  );
}

// node:http rather than fetch: undici asserts and kills the process when a
// server closes the socket while a backpressured body stream is paused.
function openDownload(url: string, redirectsLeft = 5): Promise<IncomingMessage> {
  return new Promise((resolvePromise, reject) => {
    const get = url.startsWith("https:") ? httpsGet : httpGet;
    get(url, (response) => {
      const status = response.statusCode ?? 0;
      const location = response.headers.location;
      if (status >= 300 && status < 400 && location && redirectsLeft > 0) {
        response.resume();
        resolvePromise(openDownload(new URL(location, url).toString(), redirectsLeft - 1));
        return;
      }
      if (status !== 200) {
        response.resume();
        reject(new Error(`Failed to download pack (${status}): ${url}`));
        return;
      }
      resolvePromise(response);
    }).on("error", reject);
  });
}

async function downloadToFile(url: string, dest: string): Promise<void> {
  const response = await openDownload(url);
  mkdirSync(dirname(dest), { recursive: true });
  await pipeline(response, createWriteStream(dest));
}

function runTarExtract(archive: string, dest: string): Promise<void> {
  return new Promise((resolvePromise, reject) => {
    const child = spawn("tar", ["-xzf", archive, "-C", dest], {
      stdio: ["ignore", "ignore", "pipe"],
    });
    let stderr = "";
    child.stderr.on("data", (chunk) => {
      stderr += String(chunk);
    });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) resolvePromise();
      else reject(new Error(`tar extract failed (code=${String(code)}): ${stderr.trim()}`));
    });
  });
}

async function installPack(
  root: string,
  packId: PackId,
  options: { baseUrl: string; version: string },
): Promise<void> {
  if (packId === "core") {
    throw new Error(
      "core is the vendor/cocos-core source tree inside kurenai — it is not downloaded as a pack",
    );
  }
  const url = packDownloadUrl(packId, options.baseUrl, options.version);
  const tmp = await mkdtemp(join(tmpdir(), "kurenai-pack-"));
  const archive = join(tmp, "pack.tgz");
  try {
    await downloadToFile(url, archive);
    mkdirSync(root, { recursive: true });
    await runTarExtract(archive, root);
  } finally {
    await rm(tmp, { recursive: true, force: true });
  }
  const after = inspectPack(packId, root);
  if (!after.present) {
    throw new Error(
      `Pack ${packId} downloaded from ${url} but markers still missing: ${after.missingPaths.join(", ")}`,
    );
  }
}

function runNpmInstall(dir: string): Promise<void> {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(
      "npm",
      ["install", "--omit=dev", "--no-audit", "--no-fund", "--ignore-scripts"],
      {
        cwd: dir,
        stdio: ["ignore", "ignore", "pipe"],
        env: { ...process.env, npm_config_progress: "false" },
        // npm is npm.cmd on Windows, which Node only runs through a shell.
        shell: process.platform === "win32",
      },
    );
    let stderr = "";
    child.stderr.on("data", (chunk) => {
      stderr += String(chunk);
    });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) resolvePromise();
      else reject(new Error(`npm install failed in ${dir} (code=${String(code)}): ${stderr.trim()}`));
    });
  });
}

function coreDepsInstalled(root: string): boolean {
  return (
    existsSync(join(root, "node_modules/@babel/core")) &&
    existsSync(join(root, "node_modules/sharp/package.json")) &&
    existsSync(join(root, "node_modules/jimp/package.json"))
  );
}

/**
 * vendor/cocos-core ships without full node_modules; install on first use. Engine-local
 * node_modules are never installed (publish gets what it needs from the `build` pack).
 */
async function ensureCoreDependencies(root: string): Promise<void> {
  if (coreDepsInstalled(root)) return;
  if (!existsSync(join(root, "package.json"))) return;
  await runNpmInstall(root);
}

export type EnsurePacksOptions = {
  cocosCliRoot?: string;
  /** Attempt remote install for optional platform/native packs. Default true when base URL set. */
  fetch?: boolean;
  baseUrl?: string;
  version?: string;
};

function coreVersion(options: EnsurePacksOptions): string {
  return (
    options.version ||
    process.env.KURENAI_COCOS_CORE_VERSION ||
    loadManifest().measuredAgainst?.engineVersion ||
    KURENAI_COCOS_CORE_VERSION
  );
}

/**
 * Ensure required packs under the kurenai runtime root (`vendor/cocos-core`).
 * Core is the in-tree source; optional platform packs may still fetch from a CDN.
 */
export async function ensurePacks(
  packIds: PackId[],
  options: EnsurePacksOptions = {},
): Promise<EnsurePacksResult> {
  const root = resolveCocosCliRoot(options.cocosCliRoot);
  const required = [...new Set(packIds)];
  if (required.length === 0) {
    return { root, required, alreadyPresent: [], installed: [], missing: [] };
  }

  const alreadyPresent: PackId[] = [];
  const missing: PackId[] = [];
  for (const id of required) {
    if (inspectPack(id, root).present) alreadyPresent.push(id);
    else missing.push(id);
  }

  const installed: PackId[] = [];
  const version = coreVersion(options);
  const wantRemote = options.fetch !== false;
  const baseUrl = resolvePackBaseUrl(options);

  for (const id of [...missing]) {
    if (id === "core") continue;
    const addon = packAddon(id);
    if (wantRemote && addon) {
      const mod = await loadAddon<{ installPlugin(root: string): unknown }>(addon);
      mod.installPlugin(root);
      installed.push(id);
    } else if (wantRemote && baseUrl) {
      await installPack(root, id, { baseUrl, version });
      installed.push(id);
    }
  }

  const stillMissing = required.filter((id) => !inspectPack(id, root).present);
  if (stillMissing.length) {
    const hint = stillMissing.includes("core")
      ? `Core must exist at ${bundledCocosCoreRoot()} (run: npm run vendor:cocos).`
      : stillMissing.some((id) => packAddon(id))
        ? `Run with fetch enabled so kurenai can npm-install the platform package.`
        : `Set KURENAI_COCOS_PACK_BASE_URL for optional platform/native packs.`;
    throw new Error(
      `Missing kurenai packs: ${stillMissing.join(", ")} (under ${root}).\n${hint}`,
    );
  }

  if (required.includes("core")) {
    await ensureCoreDependencies(root);
  }

  return {
    root,
    required,
    alreadyPresent,
    installed,
    missing: stillMissing,
  };
}

/** Convenience for preview / web publish. */
export async function ensureCorePack(options: EnsurePacksOptions = {}): Promise<EnsurePacksResult> {
  return ensurePacks(["core"], options);
}

export function coreIncludePrefixes(): string[] {
  return loadManifest().packs.core.include.map(stripGlob);
}
