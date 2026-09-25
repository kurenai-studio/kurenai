import { spawn } from "node:child_process";
import { createWriteStream, existsSync, mkdirSync, readFileSync } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { pipeline } from "node:stream/promises";
import { packageFile, resolveCocosCliRoot } from "./paths.js";

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
    platform: {
      packs: Array<{ id: string; dir: string; builderIdHint?: string }>;
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
    // Minimal runtime probe shared with today's publish check. Richer files are
    // reported by `packs status` via layout heuristics, not required here so
    // stub fixtures and lean cores both pass.
    return ["dist/cli.js"];
  }
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
    ...manifest.packs.platform.packs.map((pack) => pack.id),
    ...manifest.packs.native.shared.map((pack) => pack.id),
    ...manifest.packs.native.targets.map((pack) => pack.id),
    ...manifest.packs.platformTools.packs.map((pack) => pack.id),
  ];
}

/**
 * Map a cocos/kurenai build platform to the packs that must be present.
 * Web stays on core only; mini-game / native pull optional packs.
 */
export function packsForPlatform(platform: string): PackId[] {
  const normalized = platform.trim().toLowerCase();
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
  const hasCli = existsSync(join(root, "dist/cli.js"));
  const hasNative = existsSync(join(root, "packages/engine/native"));
  const platformPacksPresent = manifest.packs.platform.packs
    .map((pack) => pack.id)
    .filter((id) => inspectPack(id, root).present);

  return {
    root,
    layout: !existsSync(root)
      ? "missing"
      : hasCli
        ? "core-or-full"
        : "unknown",
    packs,
    hasNative,
    platformPacksPresent,
  };
}

function packDownloadUrl(packId: PackId, baseUrl: string, version: string): string {
  const base = baseUrl.replace(/\/$/, "");
  // e.g. https://cdn.example/cocos-packs/4.0.0-alpha.33/platform/wechat.tgz
  const slug = packId.replaceAll(":", "/");
  return `${base}/${version}/${slug}.tgz`;
}

async function downloadToFile(url: string, dest: string): Promise<void> {
  const response = await fetch(url);
  if (!response.ok || !response.body) {
    throw new Error(`Failed to download pack (${response.status}): ${url}`);
  }
  mkdirSync(dirname(dest), { recursive: true });
  await pipeline(response.body as unknown as NodeJS.ReadableStream, createWriteStream(dest));
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

export type EnsurePacksOptions = {
  cocosCliRoot?: string;
  /** Attempt HTTP install when packs are missing (needs KURENAI_COCOS_PACK_BASE_URL). */
  fetch?: boolean;
  baseUrl?: string;
  version?: string;
};

/**
 * Make sure the given packs exist under the cocos-cli root.
 * Missing packs are downloaded when `fetch` is true and a base URL is configured;
 * otherwise throws with an actionable error.
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

  if (!existsSync(root) && !options.fetch && !options.baseUrl && !process.env.KURENAI_COCOS_PACK_BASE_URL) {
    throw new Error(
      `cocos-cli not found: ${root}. Install PinK/cocos-cli or set KURENAI_COCOS_CLI_ROOT. ` +
        `For on-demand packs set KURENAI_COCOS_PACK_BASE_URL (see docs/cocos-cli-split.md).`,
    );
  }

  const alreadyPresent: PackId[] = [];
  const missing: PackId[] = [];
  for (const id of required) {
    if (inspectPack(id, root).present) alreadyPresent.push(id);
    else missing.push(id);
  }

  const installed: PackId[] = [];
  const wantFetch =
    options.fetch === true ||
    Boolean(options.baseUrl) ||
    Boolean(process.env.KURENAI_COCOS_PACK_BASE_URL);

  if (missing.length && wantFetch) {
    const baseUrl = options.baseUrl ?? process.env.KURENAI_COCOS_PACK_BASE_URL;
    if (!baseUrl) {
      throw new Error(
        `Missing cocos packs ${missing.join(", ")} under ${root}, and no KURENAI_COCOS_PACK_BASE_URL to fetch them.`,
      );
    }
    const version =
      options.version ??
      loadManifest().measuredAgainst?.engineVersion ??
      "4.0.0-alpha.33";
    for (const id of missing) {
      await installPack(root, id, { baseUrl, version });
      installed.push(id);
    }
  } else if (missing.length) {
    const hints = missing.map((id) => {
      if (id === "core") {
        return `${id}: install cocos-cli core (dist/cli.js) at ${root}`;
      }
      if (id.startsWith("platform:")) {
        return `${id}: run with a full PinK install or fetch on-demand pack (see docs/cocos-cli-split.md)`;
      }
      return `${id}: native/tool pack not present under ${root}`;
    });
    throw new Error(
      `Missing cocos packs: ${missing.join(", ")}.\n${hints.join("\n")}\n` +
        `Set KURENAI_COCOS_PACK_BASE_URL to enable on-demand download, or install the full cocos-cli.`,
    );
  }

  return {
    root,
    required,
    alreadyPresent,
    installed,
    missing: missing.filter((id) => !installed.includes(id)),
  };
}

/** Convenience for preview / web publish. */
export async function ensureCorePack(options: EnsurePacksOptions = {}): Promise<EnsurePacksResult> {
  return ensurePacks(["core"], options);
}

export function coreIncludePrefixes(): string[] {
  return loadManifest().packs.core.include.map(stripGlob);
}
