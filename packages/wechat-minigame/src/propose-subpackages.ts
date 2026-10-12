import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

export type SubpackageCandidate = {
  /** Project-relative folder, e.g. assets/levels */
  folder: string;
  bytes: number;
  files: number;
  /** Already marked isBundle in the folder .meta */
  alreadyBundle: boolean;
};

export type ProposeSubpackagesResult = {
  project: string;
  candidates: SubpackageCandidate[];
  /** Folders not yet bundles, largest first — ready for configureSubpackages. */
  suggested: string[];
};

function dirStats(dir: string): { bytes: number; files: number } {
  let bytes = 0;
  let files = 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.endsWith(".meta")) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      const nested = dirStats(full);
      bytes += nested.bytes;
      files += nested.files;
    } else if (entry.isFile()) {
      bytes += statSync(full).size;
      files += 1;
    }
  }
  return { bytes, files };
}

function isBundleMeta(metaFile: string): boolean {
  if (!existsSync(metaFile)) return false;
  try {
    const userData = (JSON.parse(readFileSync(metaFile, "utf8")) as { userData?: { isBundle?: boolean } })
      .userData;
    return userData?.isBundle === true;
  } catch {
    return false;
  }
}

/**
 * Rank top-level `assets/*` folders by on-disk size as WeChat subpackage candidates.
 * Engine/cocos-js weight is out of scope — that is kurenai's proposeEngineCuts.
 */
export function proposeSubpackages(
  projectDir: string,
  options: { limit?: number; minBytes?: number } = {},
): ProposeSubpackagesResult {
  const project = projectDir;
  const assets = join(project, "assets");
  if (!existsSync(assets)) throw new Error(`No assets/ directory: ${assets}`);

  const limit = options.limit ?? 20;
  const minBytes = options.minBytes ?? 32 * 1024;
  const candidates: SubpackageCandidate[] = [];

  for (const entry of readdirSync(assets, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name.startsWith(".")) continue;
    const absolute = join(assets, entry.name);
    const { bytes, files } = dirStats(absolute);
    if (bytes < minBytes) continue;
    const folder = relative(project, absolute).split(sep).join("/");
    candidates.push({
      folder,
      bytes,
      files,
      alreadyBundle: isBundleMeta(`${absolute}.meta`),
    });
  }

  candidates.sort((a, b) => b.bytes - a.bytes);
  const trimmed = candidates.slice(0, limit);
  return {
    project,
    candidates: trimmed,
    suggested: trimmed.filter((c) => !c.alreadyBundle).map((c) => c.folder),
  };
}
